import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { Platform } from 'react-native';

const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL ?? 'http://localhost:3000';

export default function App() {
    return (
        <SafeAreaProvider>
            <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }} edges={['top', 'bottom']}>
                <StatusBar
                    style="dark"
                    backgroundColor="#ffffff"
                    translucent={false}
                />
                <WebView
                    style={{ flex: 1 }}
                    source={{ uri: WEB_URL }}
                    incognito
                    allowsInlineMediaPlayback
                    javaScriptEnabled
                    domStorageEnabled
                    startInLoadingState
                    onShouldStartLoadWithRequest={(req) => {
                        const isSameHost =
                            req.url.startsWith(WEB_URL) ||
                            req.url.startsWith(WEB_URL + '/');
                        return isSameHost;
                    }}
                />
            </SafeAreaView>
        </SafeAreaProvider>
    );
}