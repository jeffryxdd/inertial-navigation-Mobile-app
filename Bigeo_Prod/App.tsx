// App.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from './src/screens/HomeScreen';
import MapScreen from './src/screens/MapScreen';
import PreviousTours from './src/screens/PreviousTours';
import LoginScreen from './src/screens/LoginScreen';
import SettingsScreen from './src/screens/SettingsScreen';  // Asegúrate de que esto está importado correctamente
import { RootStackParamList } from './navigationTypes';

const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
    return (
        <NavigationContainer>
            <Stack.Navigator initialRouteName="Login">
                {/* Pantalla de Inicio de Sesión */}
                <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
                {/* Pantalla de Inicio (Menú) */}
                <Stack.Screen name="Inicio" component={HomeScreen} options={{ headerShown: false }} />
                {/* Otras pantallas que se navegan desde el menú */}
                <Stack.Screen name="GenerarRecorridos" component={MapScreen} />
                <Stack.Screen name="PreviousTours" component={PreviousTours} />
                <Stack.Screen name="Configuracion" component={SettingsScreen} />
                <Stack.Screen name="Mapa" component={MapScreen} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}
