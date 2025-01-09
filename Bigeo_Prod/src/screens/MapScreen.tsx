import 'react-native-url-polyfill/auto';
import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import MapView, { Marker, Polyline, LatLng, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { Gyroscope, Accelerometer } from 'expo-sensors';
import { FontAwesome } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SQLite from 'expo-sqlite';
import { createClient } from '@supabase/supabase-js';
import * as TaskManager from 'expo-task-manager';

import KalmanFilter from 'kalmanjs';



// Configuración de Supabase
const supabaseUrl = 'https://smbfuplvavqmdwlxnhyf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtYmZ1cGx2YXZxbWR3bHhuaHlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzEyNTUyNjQsImV4cCI6MjA0NjgzMTI2NH0.2roJW4JoG-3lIQCyYDHkLRxwyVQi2yYLPW_KuQOu8n8';
const supabase = createClient(supabaseUrl, supabaseKey);

// Base de datos local
const db = SQLite.openDatabase('recorridos.db');

const LOCATION_TASK_NAME = 'background-location-task';

TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error('Error en la tarea en segundo plano:', error.message);
    return;
  }
  if (data) {
    const { locations } = data as any;
    if (locations && locations.length > 0) {
      const location = locations[0];

      // Aquí puedes almacenar la ubicación en una base de datos local o enviar los datos a tu backend
      console.log('Ubicación obtenida en segundo plano:', location.coords);
    }
  }
});


const MapScreen: React.FC = () => {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [region, setRegion] = useState<Region | undefined>(undefined);
  const [tracking, setTracking] = useState<boolean>(false);
  const [route, setRoute] = useState<LatLng[]>([]);
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);

  // Sensores inerciales
  const [acceleration, setAcceleration] = useState({ x: 0, y: 0, z: 0 });
  const [rotation, setRotation] = useState({ x: 0, y: 0, z: 0 });
  const accelerationRef = useRef(acceleration);
  const rotationRef = useRef(rotation);

  // Filtros de Kalman para GPS
  const kalmanLat = useRef(new KalmanFilter());
  const kalmanLon = useRef(new KalmanFilter());
  
  
  useEffect(() => {
    const initApp = async () => {
   
      db.transaction((tx) => {
        tx.executeSql(
          'CREATE TABLE IF NOT EXISTS storedRoutes (id INTEGER PRIMARY KEY AUTOINCREMENT, route TEXT, timestamp TEXT, userid TEXT);'  // Se agrega la columna 'userid'
        );
      });

      // Solicitar permisos de ubicación
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso de ubicación', 'Se requiere acceso a la ubicación para usar esta función.');
        return;
      }
         // Solicitar permisos para ubicación en segundo plano
         const bgStatus = await Location.requestBackgroundPermissionsAsync();
         if (bgStatus.status !== 'granted') {
           Alert.alert(
             'Permiso de ubicación en segundo plano',
             'Se requiere acceso a la ubicación en segundo plano para rastrear mientras la pantalla está apagada.'
           );
           return;
         }  

      // Suscribirse a sensores inerciales
      const accelSubscription = Accelerometer.addListener(({ x, y, z }) => {
        setAcceleration({ x, y, z });
        accelerationRef.current = { x, y, z };
      });

      const gyroSubscription = Gyroscope.addListener(({ x, y, z }) => {
        setRotation({ x, y, z });
        rotationRef.current = { x, y, z };
      });

      Accelerometer.setUpdateInterval(100); // 100ms
      Gyroscope.setUpdateInterval(100);

      return () => {
        accelSubscription.remove();
        gyroSubscription.remove();
      };
    };

    initApp();
  }, []);
  const [startLocation, setStartLocation] = useState<LatLng | null>(null);

  const startTracking = async () => {
    const hasPermission = await checkLocationPermission();
    if (!hasPermission) return;

    setTracking(true);

    // Iniciar tarea en segundo plano
    await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
      accuracy: Location.Accuracy.High,
      timeInterval: 2000, // En milisegundos
      distanceInterval: 2, // En metros
      foregroundService: {
        notificationTitle: 'Seguimiento de ubicación',
        notificationBody: 'La aplicación está rastreando tu ubicación en segundo plano.',
      },
    });
    console.log('Ubicación en segundo plano iniciada');

    locationSubscription.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 2000,
        distanceInterval: 1,
      },
      (newLocation) => {
        const { latitude, longitude } = newLocation.coords;
        
      // Si es el primer punto, lo guardamos como punto de inicio
      if (!startLocation) {
        setStartLocation({ latitude, longitude });
      }


        // Aplicar filtro de Kalman
        const filteredLat = kalmanLat.current.filter(latitude);
        const filteredLon = kalmanLon.current.filter(longitude);

        // Calcular desplazamiento inercial
        const displacement = calculateDisplacement();

        // Fusionar datos GPS e inerciales
        const fusedLat = filteredLat + displacement.deltaLat;
        const fusedLon = filteredLon + displacement.deltaLon;

        // Actualizar ubicación y ruta
        const newCoord = { latitude: fusedLat, longitude: fusedLon };
        setLocation(newLocation);
        setRoute((prevRoute) => [...prevRoute, newCoord]);

        setRegion({
          latitude: fusedLat,
          longitude: fusedLon,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      }
    );
  };


  const stopTracking = async () => {
    if (locationSubscription.current) {
      locationSubscription.current.remove();
      locationSubscription.current = null;
    }
    setTracking(false);

    // Detener tarea en segundo plano
    await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
  };


  const calculateDisplacement = () => {
    if (!location || !location.coords) {
      return { deltaLat: 0, deltaLon: 0 };
    }

    const { x, y } = accelerationRef.current;
    const deltaTime = 0.1; // 100ms

    const deltaX = x * deltaTime ** 2;
    const deltaY = y * deltaTime ** 2;

    const earthRadius = 6371000; // metros
    const deltaLat = (deltaY / earthRadius) * (180 / Math.PI);
    const deltaLon =
      (deltaX / (earthRadius * Math.cos(Math.PI * location.coords.latitude / 180))) * (180 / Math.PI);

    return { deltaLat, deltaLon };
  };

  const checkLocationPermission = async () => {
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso de ubicación', 'Se requiere acceso a la ubicación para usar esta función.');
      return false;
    }
    return true;
  };

  const storeRouteLocally = async () => {
    try {
        const timestamp = new Date().toISOString();
        const userId = await AsyncStorage.getItem('userId');  // Obtener el userId desde AsyncStorage

        if (!userId) {
            Alert.alert('Error', 'No se pudo obtener el ID del usuario.');
            return;
        }

        // Abrir la base de datos y almacenar el recorrido localmente
        db.transaction((tx) => {
            tx.executeSql(
                'INSERT INTO storedRoutes (route, timestamp, userid) VALUES (?, ?, ?);',
                [JSON.stringify(route), timestamp, userId],  // Guardar el recorrido, el timestamp y el userId
                () => {
                    Alert.alert('Guardado', 'El recorrido ha sido guardado localmente.');
                },
                (tx, error) => {
                    console.error('Error al guardar el recorrido localmente:', error);
                    Alert.alert('Error', 'No se pudo guardar el recorrido localmente.');
                    return true;  // Retornar `true` para evitar que el error se propague
                }
            );
        });
    } catch (error) {
        console.error('Error al intentar guardar localmente:', error);
    }
};



  const syncData = async () => {
    try {
        // Recuperar el id del usuario desde AsyncStorage
        const userId = await AsyncStorage.getItem('userId');
        
        if (!userId) {
            Alert.alert('Error', 'No se encontró el ID del usuario.');
            return;
        }

        // Insertar el recorrido en la base de datos
        const { error } = await supabase.from('recorridos').insert([
            {
                route: JSON.stringify(route), // Almacenar como JSON
                datetime: new Date().toISOString(),
                userid: parseInt(userId), // Usar el ID del usuario
            },
        ]);

        if (error) {
            console.error('Error al sincronizar con Supabase:', error.message);
            Alert.alert('Error', 'No se pudo sincronizar el recorrido con la nube.');
        } else {
            Alert.alert('Recorrido sincronizado', 'Los datos se han guardado en la nube.');
        }
    } catch (error) {
        console.error('Error al intentar sincronizar:', error);
    }
};


  
  const handleFinish = () => {
    Alert.alert('¿Deseas terminar el recorrido?', 'Si confirmas, se eliminará el recorrido actual.', [
      { text: 'Cancelar', style: 'cancel', onPress: () => setTracking(true) },
      {
        text: 'Terminar',
        onPress: () => {
          stopTracking();
          setRoute([]);
          AsyncStorage.removeItem('route');
          Alert.alert('Recorrido terminado', '¿Deseas sincronizar ahora?', [
            {
              text: 'No',
              style: 'cancel',
              onPress: () => {
                Alert.alert('Guardar Localmente', '¿Deseas guardar el recorrido localmente?', [
                  { text: 'No', style: 'cancel' },
                  { text: 'Sí', onPress: storeRouteLocally },
                ]);
              },
            },
            { text: 'Sí', onPress: syncData },
          ]);
        },
      },
    ]);
  };


  return (
    <View style={styles.container}>
    <MapView
  style={styles.map}
  region={region}
  showsUserLocation={true}
  followsUserLocation={tracking}
>
  {location && (
    <Marker
      coordinate={{
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      }}
      title="Tú estás aquí"
    />
  )}

  {/* Marcador para el punto de inicio */}
  {startLocation && (
    <Marker
      coordinate={startLocation}
      title="Punto de inicio"
      pinColor="green"  // Puedes cambiar el color o el ícono
    />
  )}

  <Polyline coordinates={route} strokeColor="red" strokeWidth={3} />
</MapView>


    <View style={styles.controls}>
      <TouchableOpacity
        style={styles.controlButton}
        onPress={tracking ? stopTracking : startTracking}
      >
        <FontAwesome name={tracking ? 'pause' : 'play'} size={30} color="white" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.controlButton} onPress={handleFinish}>
        <FontAwesome name="stop" size={30} color="white" />
      </TouchableOpacity>
    </View>
  </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  controls: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  controlButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 10,
    borderRadius: 30,
  },
});

export default MapScreen;
