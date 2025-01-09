import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from './supabaseClient'; // Asegúrate de importar supabase correctamente
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigationTypes';
import AsyncStorage from '@react-native-async-storage/async-storage';

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

const LoginScreen: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const navigation = useNavigation<LoginScreenNavigationProp>();

    const handleLogin = async () => {
        const { data, error } = await supabase
            .from('users')
            .select('id, username, password')
            .eq('username', username)
            .single();
    
        if (error) {
            Alert.alert('Error', 'Usuario no encontrado');
        } else {
            if (data.password === password) {
                // Guardar el id del usuario en AsyncStorage o en un estado global
                await AsyncStorage.setItem('userId', data.id.toString()); // Guarda el userId
                navigation.navigate('Inicio');
            } else {
                Alert.alert('Error', 'Contraseña incorrecta');
            }
        }
    };
    

    return (
        <View style={styles.container}>
            <Image source={require('../../assets/bigeo.png')} style={styles.logo} />
            <TextInput
                style={styles.input}
                placeholder="Usuario"
                placeholderTextColor="#A9A9A9"
                value={username}
                onChangeText={setUsername}
            />
            <TextInput
                style={styles.input}
                placeholder="Contraseña"
                placeholderTextColor="#A9A9A9"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
            />
            <TouchableOpacity style={styles.button} onPress={handleLogin}>
                <Text style={styles.buttonText}>ENTRAR</Text>
            </TouchableOpacity>
            <View style={styles.alertContainer}>
                <Text style={styles.alertText}>
                    ⚠️ Recuerda que para el primer inicio de sesión debes contar con una conexión a internet estable para el correcto funcionamiento de esta aplicación.
                </Text>
            </View>
            <Text style={styles.version}>Versión 0.0.0.1</Text>
            <Text style={styles.footerText}>OCOACL</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        padding: 20,
    },
    logo: {
        width: 220,
        height: undefined,
        aspectRatio: 1,
        resizeMode: 'contain',
        marginBottom: 20,
    },
    input: {
        width: '100%',
        height: 50,
        backgroundColor: '#E9ECEF',
        borderRadius: 5,
        paddingHorizontal: 10,
        fontSize: 16,
        marginBottom: 15,
    },
    button: {
        width: '100%',
        height: 50,
        backgroundColor: '#0C5332',
        borderRadius: 5,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    alertContainer: {
        width: '100%',
        backgroundColor: '#E9ECEF',
        borderRadius: 5,
        padding: 10,
        marginBottom: 20,
    },
    alertText: {
        fontSize: 14,
        color: '#333333',
        textAlign: 'center',
    },
    version: {
        fontSize: 12,
        color: '#A9A9A9',
        marginBottom: 5,
    },
    footerText: {
        fontSize: 12,
        color: '#A9A9A9',
        textAlign: 'center',
    },
});

export default LoginScreen;
