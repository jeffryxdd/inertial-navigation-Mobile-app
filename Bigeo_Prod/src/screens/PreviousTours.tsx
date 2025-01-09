import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Alert } from 'react-native';
import * as SQLite from 'expo-sqlite';
import { supabase } from './supabaseClient'; // Asegúrate de importar correctamente el cliente de Supabase
import AsyncStorage from '@react-native-async-storage/async-storage';

const db = SQLite.openDatabase('recorridos.db');

const PreviousTours: React.FC = () => {
  const [tours, setTours] = useState<any[]>([]);

  useEffect(() => {
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM storedRoutes;',
        [],
        (_, { rows }) => {
          const toursList = rows._array;
          setTours(toursList);
        },
        (error) => {
          console.error('Error fetching tours:', error);
          return true; // Devuelve true para indicar que el error ha sido manejado
        }
      );
    });
  }, []);

  // Función para sincronizar el recorrido seleccionado con Supabase
  const syncWithSupabase = async (tour: any) => {
    try {
      const userId = await AsyncStorage.getItem('userId');
        
      if (!userId) {
          Alert.alert('Error', 'No se encontró el ID del usuario.');
          return;
      }
      const localTour = {
        id: tour.id,
        route: tour.route,
        datetime: new Date(tour.timestamp).toISOString().split('T').join(' ').split('Z')[0],
        userid: userId, // ID del usuario
      };
  
      const { data, error } = await supabase
        .from('recorridos')
        .upsert([localTour], { onConflict: 'id' });
  
      if (error) {
        console.error('Error syncing tour to Supabase:', error);
        Alert.alert('Error', 'Hubo un problema al sincronizar el recorrido.');
        return;
      }
  
      // Elimina solo el recorrido sincronizado
      db.transaction(tx => {
        tx.executeSql(
          'DELETE FROM storedRoutes WHERE id = ?;',
          [tour.id], // Elimina solo el recorrido con el ID correspondiente
          (_, result) => {
            setTours(prevTours => prevTours.filter(t => t.id !== tour.id)); // Actualiza la UI
          },
          (error) => {
            console.error('Error deleting tour from local database:', error);
            return true;
          }
        );
      });
  
      Alert.alert('Sincronización exitosa', 'El recorrido se ha sincronizado con Supabase y eliminado de la base de datos local.');
    } catch (error) {
      console.error('Error during sync:', error);
      Alert.alert('Error', 'Hubo un error durante la sincronización.');
    }
  };

  // Función para manejar la acción al presionar un recorrido
  const handleItemPress = (item: any) => {
    Alert.alert(
      '¿Qué deseas hacer?',
      `¿Quieres sincronizar o borrar el recorrido con ID: ${item.id}?`,
      [
        {
          text: 'Sincronizar',
          onPress: () => {
            // Sincronizar solo el recorrido seleccionado con Supabase
            syncWithSupabase(item);
          },
        },
        {
          text: 'Borrar',
          onPress: () => {
            // Eliminar solo el recorrido seleccionado
            db.transaction(tx => {
              tx.executeSql(
                'DELETE FROM storedRoutes WHERE id = ?;',
                [item.id],
                (_, result) => {
                  setTours(prevTours => prevTours.filter(tour => tour.id !== item.id));
                  Alert.alert('Recorrido borrado', `El recorrido con ID: ${item.id} ha sido borrado.`);
                },
                (error) => {
                  console.error('Error deleting tour:', error);
                  return true;
                }
              );
            });
          },
        },
        {
          text: 'Cancelar',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.item} onTouchEnd={() => handleItemPress(item)}>
      <Text>Recorrido ID: {item.id}</Text>
      <Text>Ruta: {item.route}</Text>
      <Text>Guardado en: {item.timestamp}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={tours}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f0f0f0',
  },
  item: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    backgroundColor: 'white',
    marginBottom: 10,
  },
});

export default PreviousTours;
