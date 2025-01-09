import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Accelerometer, Gyroscope  } from 'expo-sensors';

const ConfiguracionScreen: React.FC = () => {
  const [accelerometerData, setAccelerometerData] = useState<any>({ x: 0, y: 0, z: 0 });
  const [gyroscopeData, setGyroscopeData] = useState<any>({ x: 0, y: 0, z: 0 });

  // Hook para activar el acelerómetro y giroscopio
  useEffect(() => {
    const accelerometerSubscription = Accelerometer.addListener((data) => {
      setAccelerometerData(data);
    });
    const gyroscopeSubscription = Gyroscope.addListener((data) => {
      setGyroscopeData(data);
    });

    return () => {
      accelerometerSubscription.remove();
      gyroscopeSubscription.remove();
    };
  }, []);

  // Función para manejar el reset de los sensores
  const handleResetSensors = () => {
    // Detener la escucha de los datos actuales (reset)
    Accelerometer.removeAllListeners();
    Gyroscope.removeAllListeners();

    // Iniciar los sensores nuevamente (reset de datos)
    Accelerometer.setUpdateInterval(1000); // 1 segundo de intervalo
    Gyroscope.setUpdateInterval(1000);

    // Volver a escuchar los valores de los sensores
    Accelerometer.addListener((data) => {
      setAccelerometerData(data);
    });
    Gyroscope.addListener((data) => {
      setGyroscopeData(data);
    });

    Alert.alert('Sensores Restablecidos', 'Los sensores fueron reseteados y comienzan a funcionar nuevamente.');
  };

  return (
    <View style={styles.container}>
      {/* Botón para resetear los sensores */}
      <TouchableOpacity
        style={styles.menuButton}
        onPress={handleResetSensors}
      >
        <Text style={styles.buttonText}>Resetear Sensores</Text>
      </TouchableOpacity>

      {/* Información de los sensores */}
      <Text style={styles.sensorData}>Acelerómetro: x: {accelerometerData.x.toFixed(2)} y: {accelerometerData.y.toFixed(2)} z: {accelerometerData.z.toFixed(2)}</Text>
      <Text style={styles.sensorData}>Giroscopio: x: {gyroscopeData.x.toFixed(2)} y: {gyroscopeData.y.toFixed(2)} z: {gyroscopeData.z.toFixed(2)}</Text>

      <Text style={styles.versionText}>Versión 0.1</Text>
      <Text style={styles.subText}>OCOACL</Text>
    </View>
  );
};

// Estilos
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5', // Color de fondo
  },
  menuButton: {
    backgroundColor: '#2F513B', // Color de fondo del botón
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 10,
    marginVertical: 10,
    width: '80%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',  // Color del texto del botón
    fontSize: 16,
    fontWeight: 'bold',
  },
  sensorData: {
    fontSize: 14,
    marginTop: 10,
    color: '#333',
  },
  versionText: {
    marginTop: 20,
    fontSize: 12,
    color: '#A9A9A9',  // Color gris para la versión
  },
  subText: {
    fontSize: 12,
    color: '#A9A9A9',  // Color gris para el subtítulo
  },
});

export default ConfiguracionScreen;
