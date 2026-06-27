import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import React, { useState, useCallback } from 'react';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { AppStack } from '../navigation/types';
import { API_URL } from '../api/client';

type Nav = NativeStackNavigationProp<AppStack, 'Habits'>;

export default function HabitsScreen() {

    const { token, logout} = useAuth();
    const navigation = useNavigation<Nav>();
    const [habits, setHabits] = useState<any[]>([]);

    // Refetch every time this screen comes into focus (e.g. returning from CreateHabit)
    useFocusEffect(
        useCallback(() => {
            if (!token) return;
            fetch(`${API_URL}/habits`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            .then(res => res.json())
            .then(data => setHabits(Array.isArray(data) ? data : []))
            .catch(err => console.log('fetch error:', err));
        }, [token])
    );

    return (
    <View style={styles.container}>
        <View style={styles.header}>
            <Text style={styles.title}>My Habbits</Text>
            <View style={styles.headerActions}>
                <TouchableOpacity onPress={() => navigation.navigate('CreateHabit')} style={styles.addBtn}>
                    <Text style={styles.addBtnText}>+</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={logout}>
                    <Text style={styles.logout}>Log Out</Text>
                </TouchableOpacity>
            </View>
        </View>
        <FlatList
            data={habits}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
                <View style={styles.habit}>
                    <Text style={styles.habitName}>{item.name}</Text>
                </View>
            )}
        />
    </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 24, paddingTop: 60 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom:
  24 },
    title: { fontSize: 28, fontWeight: 'bold' },
    headerActions: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    addBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' },
    addBtnText: { color: '#fff', fontSize: 24, lineHeight: 28 },
    logout: { color: '#888', fontSize: 14 },
    habit: { padding: 16, borderWidth: 1, borderColor: '#eee', borderRadius: 8, marginBottom: 12 },
    habitName: { fontSize: 16 },
  });
