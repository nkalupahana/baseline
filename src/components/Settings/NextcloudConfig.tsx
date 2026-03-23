import { useState } from 'react';
import { IonButton, IonInput, IonItem, IonLabel, IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonContent, IonIcon } from '@ionic/react';
import { cloudOutline, closeCircleOutline } from 'ionicons/icons';
import { NextcloudConfig } from '../../nextcloud';

interface NextcloudLoginProps {
    onLogin: (config: NextcloudConfig) => void;
    isOpen: boolean;
    onClose: () => void;
}

export const NextcloudLogin: React.FC<NextcloudLoginProps> = ({ onLogin, isOpen, onClose }) => {
    const [serverUrl, setServerUrl] = useState('');
    const [clientId, setClientId] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = () => {
        if (!serverUrl) {
            setError('Please enter your Nextcloud server URL');
            return;
        }

        // Validate URL
        try {
            new URL(serverUrl);
        } catch {
            setError('Please enter a valid URL (e.g., https://cloud.example.com)');
            return;
        }

        // Remove trailing slash
        const cleanUrl = serverUrl.replace(/\/$/, '');

        onLogin({
            serverUrl: cleanUrl,
            clientId: clientId || 'baseline-app',
        });

        // Reset form
        setServerUrl('');
        setClientId('');
        setError('');
        onClose();
    };

    return (
        <IonModal isOpen={isOpen} onDidDismiss={onClose}>
            <IonHeader>
                <IonToolbar>
                    <IonTitle>Nextcloud Sign In</IonTitle>
                    <IonButtons slot="end">
                        <IonButton onClick={onClose}>
                            <IonIcon icon={closeCircleOutline} />
                        </IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>
            <IonContent className="ion-padding">
                <div style={{ maxWidth: '400px', margin: '0 auto', paddingTop: '20px' }}>
                    <p style={{ marginBottom: '20px', color: '#666' }}>
                        Sign in with your Nextcloud account to sync your data. 
                        You can use your own self-hosted Nextcloud server or any public Nextcloud instance.
                    </p>

                    <IonItem>
                        <IonLabel position="stacked">Nextcloud Server URL *</IonLabel>
                        <IonInput
                            type="url"
                            placeholder="https://cloud.example.com"
                            value={serverUrl}
                            onIonChange={(e) => setServerUrl(e.detail.value || '')}
                        />
                    </IonItem>

                    <IonItem style={{ marginTop: '10px' }}>
                        <IonLabel position="stacked">OAuth Client ID (optional)</IonLabel>
                        <IonInput
                            type="text"
                            placeholder="baseline-app"
                            value={clientId}
                            onIonChange={(e) => setClientId(e.detail.value || '')}
                        />
                    </IonItem>

                    {error && (
                        <p style={{ color: 'red', marginTop: '10px', fontSize: '14px' }}>
                            {error}
                        </p>
                    )}

                    <div style={{ marginTop: '20px' }}>
                        <IonButton expand="block" onClick={handleSubmit}>
                            <IonIcon slot="start" icon={cloudOutline} />
                            Sign In with Nextcloud
                        </IonButton>
                    </div>

                    <div style={{ marginTop: '30px', padding: '15px', background: '#f5f5f5', borderRadius: '8px' }}>
                        <p style={{ fontSize: '13px', color: '#666', margin: 0 }}>
                            <strong>For self-hosted Nextcloud:</strong><br />
                            Make sure OAuth2 app is installed and configured on your Nextcloud server.
                            You may need to create an OAuth2 client in your Nextcloud admin settings.
                        </p>
                    </div>

                    <div style={{ marginTop: '15px', padding: '15px', background: '#e8f4f8', borderRadius: '8px' }}>
                        <p style={{ fontSize: '13px', color: '#666', margin: 0 }}>
                            <strong>Don't have a Nextcloud account?</strong><br />
                            You can sign up for a free account at{' '}
                            <a href="https://nextcloud.com/signup/" target="_blank" rel="noopener noreferrer">
                                nextcloud.com
                            </a>
                        </p>
                    </div>
                </div>
            </IonContent>
        </IonModal>
    );
};

export default NextcloudLogin;