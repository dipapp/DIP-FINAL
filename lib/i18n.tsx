import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'en' | 'es';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Translation data
const translations = {
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.admin': 'Admin',
    'nav.dashboard': 'Dashboard',
    'nav.signIn': 'Sign in',
    'nav.signOut': 'Sign out',
    'nav.createAccount': 'Create account',
    'nav.language': 'Language',
    
    // Landing page
    'landing.tagline': 'Drive with confidence knowing you\'re supported',
    'landing.whyChoose': 'Why Choose DIP?',
    'landing.completeBenefits': 'Complete Benefits',
    'landing.completeBenefitsDesc': 'Your membership benefits are fully active when accidents happen',
    'landing.monthlyPrice': 'Just $20/month',
    'landing.monthlyPriceDesc': 'Affordable monthly membership that saves you thousands',
    'landing.instantClaims': 'Instant Requests & Roadside Accident Towing',
    'landing.instantClaimsDesc': 'File requests in minutes with our streamlined process',
    'landing.trustedPartners': 'Trusted Partner Network',
    'landing.trustedPartnersDesc': 'Guaranteed quality repairs at our certified shops only',
    'landing.readyToGetSupported': 'Ready to get supported?',
    'landing.joinThousands': 'Join thousands of drivers who trust DIP',
    'landing.getStarted': 'Get Started →',
    'landing.secure': 'Secure',
    'landing.verified': 'Verified',
    'landing.rating': '5.0 Rating',
    'landing.copyright': '© 2025 dip. All rights reserved.',
    
    // Auth pages
    'auth.signIn': 'Sign In',
    'auth.signUp': 'Sign Up',
    'auth.logIn': 'Log In',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.confirmPassword': 'Confirm Password',
    'auth.firstName': 'First Name',
    'auth.lastName': 'Last Name',
    'auth.phone': 'Phone Number',
    'auth.forgotPassword': 'Forgot password?',
    'auth.alreadyHaveAccount': 'Already have an account?',
    'auth.dontHaveAccount': 'Don\'t have an account?',
    'auth.signInButton': 'Sign In',
    'auth.signUpButton': 'Sign Up',
    'auth.resetPassword': 'Reset Password',
    'auth.sendResetLink': 'Send Reset Link',
    'auth.signingIn': 'Signing In...',
    'auth.creatingAccount': 'Creating Account...',
    'auth.phoneNumberDesc': 'Phone number will be used for claim communications',
    'auth.termsAgreement': 'I agree to the Terms of Service and acknowledge the Privacy Policy. I consent to receive disclosures electronically and to use electronic signatures.',
    'auth.termsOfService': 'Terms of Service',
    'auth.privacyPolicy': 'Privacy Policy',
    'auth.marketingOptIn': 'I\'d like to receive product updates and promotions.',
    'auth.dataCollectionNotice': 'We collect identity (name, driver\'s license image), vehicle (VIN, photos), insurance details (insurance card image), and contact information to set up your account, verify identity, assist with claims, and prevent fraud. We retain this data only as long as necessary for these purposes. Learn more in our Privacy Policy.',
    'auth.fillAllFields': 'Please fill in all fields.',
    'auth.passwordsDontMatch': 'Passwords do not match.',
    'auth.agreeToTerms': 'You must agree to the Terms and Conditions.',
    'auth.passwordTooShort': 'Password must be at least 6 characters long.',
    'auth.enterEmailPassword': 'Please enter your email and password.',
    'auth.failedToSignIn': 'Failed to sign in',
    'auth.failedToCreateAccount': 'Failed to create account',
    
    // Dashboard
    'dashboard.welcome': 'Welcome',
    'dashboard.overview': 'Overview',
    'dashboard.vehicles': 'Vehicles',
    'dashboard.claims': 'Requests',
    'dashboard.profile': 'Profile',
    'dashboard.subscription': 'Subscription',
    
    // Admin
    'admin.settings': 'System Settings',
    'admin.settingsDesc': 'Configure all aspects of the DIP portal system.',
    'admin.backToAdmin': '← Back to Admin',
    'admin.saveSettings': 'Save All Settings',
    'admin.resetDefaults': 'Reset to Defaults',
    'admin.confirmReset': 'Are you sure you want to reset all settings to defaults?',
    'admin.settingsSaved': 'Settings saved successfully!',
    'admin.settingsReset': 'Settings reset to defaults!',
    
    // Common
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.edit': 'Edit',
    'common.delete': 'Delete',
    'common.yes': 'Yes',
    'common.no': 'No',
    'common.back': 'Back',
    'common.next': 'Next',
    'common.previous': 'Previous',
    'common.submit': 'Submit',
    'common.close': 'Close',
    'common.open': 'Open',
    'common.enabled': 'Enabled',
    'common.disabled': 'Disabled',
    'common.required': 'Required',
    'common.optional': 'Optional',
  },
  es: {
    // Navigation
    'nav.home': 'Inicio',
    'nav.admin': 'Administrador',
    'nav.dashboard': 'Panel',
    'nav.signIn': 'Iniciar sesión',
    'nav.signOut': 'Cerrar sesión',
    'nav.createAccount': 'Crear cuenta',
    'nav.language': 'Idioma',
    
    // Landing page
    'landing.tagline': 'Conduce con confianza sabiendo que estás apoyado',
    'landing.whyChoose': '¿Por qué elegir DIP?',
    'landing.completeBenefits': 'Beneficios Completos',
    'landing.completeBenefitsDesc': 'Tus beneficios de membresía están completamente activos cuando ocurren accidentes',
    'landing.monthlyPrice': 'Solo $20/mes',
    'landing.monthlyPriceDesc': 'Membresía mensual asequible que te ahorra miles',
    'landing.instantClaims': 'Solicitudes Instantáneas y Remolque por Accidente',
    'landing.instantClaimsDesc': 'Presenta solicitudes en minutos con nuestro proceso simplificado',
    'landing.trustedPartners': 'Red de Socios de Confianza',
    'landing.trustedPartnersDesc': 'Reparaciones de calidad garantizada solo en nuestros talleres certificados',
    'landing.readyToGetSupported': '¿Listo para estar apoyado?',
    'landing.joinThousands': 'Únete a miles de conductores que confían en DIP',
    'landing.getStarted': 'Comenzar →',
    'landing.secure': 'Seguro',
    'landing.verified': 'Verificado',
    'landing.rating': 'Calificación 5.0',
    'landing.copyright': '© 2025 dip. Todos los derechos reservados.',
    
    // Auth pages
    'auth.signIn': 'Iniciar Sesión',
    'auth.signUp': 'Registrarse',
    'auth.logIn': 'Iniciar Sesión',
    'auth.email': 'Correo Electrónico',
    'auth.password': 'Contraseña',
    'auth.confirmPassword': 'Confirmar Contraseña',
    'auth.firstName': 'Nombre',
    'auth.lastName': 'Apellido',
    'auth.phone': 'Número de Teléfono',
    'auth.forgotPassword': '¿Olvidaste tu contraseña?',
    'auth.alreadyHaveAccount': '¿Ya tienes una cuenta?',
    'auth.dontHaveAccount': '¿No tienes una cuenta?',
    'auth.signInButton': 'Iniciar Sesión',
    'auth.signUpButton': 'Registrarse',
    'auth.resetPassword': 'Restablecer Contraseña',
    'auth.sendResetLink': 'Enviar Enlace de Restablecimiento',
    'auth.signingIn': 'Iniciando Sesión...',
    'auth.creatingAccount': 'Creando Cuenta...',
    'auth.phoneNumberDesc': 'El número de teléfono se usará para comunicaciones de reclamos',
    'auth.termsAgreement': 'Acepto los Términos de Servicio y reconozco la Política de Privacidad. Consiento recibir divulgaciones electrónicamente y usar firmas electrónicas.',
    'auth.termsOfService': 'Términos de Servicio',
    'auth.privacyPolicy': 'Política de Privacidad',
    'auth.marketingOptIn': 'Me gustaría recibir actualizaciones de productos y promociones.',
    'auth.dataCollectionNotice': 'Recopilamos identidad (nombre, imagen de licencia de conducir), vehículo (VIN, fotos), detalles de seguro (imagen de tarjeta de seguro) e información de contacto para configurar su cuenta, verificar identidad, ayudar con reclamos y prevenir fraude. Conservamos estos datos solo el tiempo necesario para estos propósitos. Obtenga más información en nuestra Política de Privacidad.',
    'auth.fillAllFields': 'Por favor complete todos los campos.',
    'auth.passwordsDontMatch': 'Las contraseñas no coinciden.',
    'auth.agreeToTerms': 'Debe aceptar los Términos y Condiciones.',
    'auth.passwordTooShort': 'La contraseña debe tener al menos 6 caracteres.',
    'auth.enterEmailPassword': 'Por favor ingrese su correo electrónico y contraseña.',
    'auth.failedToSignIn': 'Error al iniciar sesión',
    'auth.failedToCreateAccount': 'Error al crear cuenta',
    
    // Dashboard
    'dashboard.welcome': 'Bienvenido',
    'dashboard.overview': 'Resumen',
    'dashboard.vehicles': 'Vehículos',
    'dashboard.claims': 'Solicitudes',
    'dashboard.profile': 'Perfil',
    'dashboard.subscription': 'Suscripción',
    
    // Admin
    'admin.settings': 'Configuración del Sistema',
    'admin.settingsDesc': 'Configura todos los aspectos del sistema del portal DIP.',
    'admin.backToAdmin': '← Volver al Administrador',
    'admin.saveSettings': 'Guardar Todas las Configuraciones',
    'admin.resetDefaults': 'Restablecer a Valores Predeterminados',
    'admin.confirmReset': '¿Estás seguro de que quieres restablecer todas las configuraciones a los valores predeterminados?',
    'admin.settingsSaved': '¡Configuraciones guardadas exitosamente!',
    'admin.settingsReset': '¡Configuraciones restablecidas a valores predeterminados!',
    
    // Common
    'common.loading': 'Cargando...',
    'common.error': 'Error',
    'common.success': 'Éxito',
    'common.cancel': 'Cancelar',
    'common.save': 'Guardar',
    'common.edit': 'Editar',
    'common.delete': 'Eliminar',
    'common.yes': 'Sí',
    'common.no': 'No',
    'common.back': 'Atrás',
    'common.next': 'Siguiente',
    'common.previous': 'Anterior',
    'common.submit': 'Enviar',
    'common.close': 'Cerrar',
    'common.open': 'Abrir',
    'common.enabled': 'Habilitado',
    'common.disabled': 'Deshabilitado',
    'common.required': 'Requerido',
    'common.optional': 'Opcional',
  }
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    // Load language from localStorage on mount
    const savedLanguage = localStorage.getItem('dip-language') as Language;
    if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'es')) {
      setLanguageState(savedLanguage);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('dip-language', lang);
    // Update HTML lang attribute
    document.documentElement.lang = lang;
  };

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations[typeof language]] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
