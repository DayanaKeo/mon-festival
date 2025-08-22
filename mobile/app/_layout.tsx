import { Stack } from 'expo-router'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'

export default function RootLayout() {
    return (
        <SafeAreaProvider>
            <StatusBar style="light" translucent backgroundColor="transparent" />
            <Stack
                screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: '#0b0f1a' }
                }}
            />
        </SafeAreaProvider>
    )
}