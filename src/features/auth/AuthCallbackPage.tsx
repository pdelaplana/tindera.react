// Auth Callback Page - handles OAuth redirects (e.g. Google Sign-In)

import { IonContent, IonLoading, IonPage } from '@ionic/react';
import { useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { supabase } from '@/services/supabase';

const AuthCallbackPage: React.FC = () => {
  const history = useHistory();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        history.replace('/shops');
      } else {
        history.replace('/signin');
      }
    });
  }, [history]);

  return (
    <IonPage>
      <IonContent>
        <IonLoading isOpen message="Signing you in..." />
      </IonContent>
    </IonPage>
  );
};

export default AuthCallbackPage;
