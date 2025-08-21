import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, Platform } from 'react-native';
import { WebView } from 'react-native-webview';

const WEB_URL = 'http://192.168.2.127:3000'; // mets ton IP LAN ou ton domaine

export default function App() {
    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#0b0f1a' }}>
            <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
            <WebView
                source={{ uri: WEB_URL }}
                incognito
                allowsInlineMediaPlayback
                javaScriptEnabled
                domStorageEnabled
                startInLoadingState
                // Ouvre les liens externes dans le navigateur système :
                onShouldStartLoadWithRequest={(req) => {
                    const isSameHost =
                        req.url.startsWith(WEB_URL) ||
                        // autorise sous-chemins (évite boucle) :
                        req.url.startsWith(WEB_URL + '/');
                    return isSameHost;
                }}
            />
        </SafeAreaView>
    );
}
