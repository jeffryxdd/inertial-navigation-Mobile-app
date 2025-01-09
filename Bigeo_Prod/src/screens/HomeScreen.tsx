import React from 'react';
import { View, Image, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';

type HomeScreenProps = {
  navigation: StackNavigationProp<any, 'Home'>;
  userName: string; // Suponiendo que tienes el nombre del usuario disponible
};

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation, userName }) => {
  return (
    <View style={styles.container}>
      {/* Logo */}
      <Image source={require('../../assets/bigeo.png')} style={styles.logo} />

      {/* Título de bienvenida */}
      <Text style={styles.welcomeText}>Bienvenido {userName}</Text>

      {/* Botones de menú */}
      <TouchableOpacity
        style={styles.menuButton}
        onPress={() => navigation.navigate('GenerarRecorridos')}
      >
        <Text style={styles.buttonText}>Generar recorridos</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.menuButton}
        onPress={() => navigation.navigate('PreviousTours')}
      >
        <Text style={styles.buttonText}>Ver recorridos anteriores</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.menuButton}
        onPress={() => navigation.navigate('Configuracion')}
      >
        <Text style={styles.buttonText}>Configuración</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.menuButton}
        onPress={() => {
          // Aquí podrías implementar la lógica para cerrar sesión
          console.log('Cerrar sesión');
          navigation.navigate('Login'); // Cambia 'Login' por el nombre de tu pantalla de inicio de sesión
        }}
      >
        <Text style={styles.buttonText}>Cerrar sesión</Text>
      </TouchableOpacity>

      {/* Versión */}
      <Text style={styles.versionText}>Versión 0</Text>
      <Text style={styles.subText}>OCOACL</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  logo: {
    width: 250,
    height: 150,
    resizeMode: 'contain',
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2F513B',
    marginBottom: 20,
  },
  menuButton: {
    backgroundColor: '#2F513B',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 10,
    marginVertical: 10,
    width: '80%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  versionText: {
    marginTop: 20,
    fontSize: 12,
    color: '#A9A9A9',
  },
  subText: {
    fontSize: 12,
    color: '#A9A9A9',
  },
});

export default HomeScreen;
