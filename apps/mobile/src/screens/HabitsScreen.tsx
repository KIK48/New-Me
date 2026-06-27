import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import React, {useState, useEffect} from 'react';
import { useAuth } from '../context/AuthContext';

export default function HabitsScreen() {

    const { token, logout} = useAuth();
    const [habits, setHabits] = useState<any[]>([]);

    useEffect(() => {
        if (!token) return;
        fetch('https://new-me-l46q.onrender.com/habits', {
            headers: { Authorization: `Bearer ${token}` },
        })
        .then(res => res.json())
        .then(data => setHabits(Array.isArray(data) ? data : []))
        .catch(err => console.log('fetch error:', err));
    }, [token]);

    return (
    <View style={styles.container}>
        <View style={styles.header}>
            <Text style={styles.title}>My Habbits</Text>
            <TouchableOpacity onPress={logout}>
                <Text style={styles.logout}>Log Out</Text>
            </TouchableOpacity>
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
    logout: { color: '#888', fontSize: 14 },
    habit: { padding: 16, borderWidth: 1, borderColor: '#eee', borderRadius: 8, marginBottom: 12 },
    habitName: { fontSize: 16 },
  });