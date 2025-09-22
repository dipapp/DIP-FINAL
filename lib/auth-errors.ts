/**
 * Maps Firebase authentication error codes to professional, user-friendly messages
 */
export function getAuthErrorMessage(error: any): string {
  const errorCode = error?.code || error?.message || '';
  
  // Firebase Auth error code mappings
  const errorMessages: Record<string, string> = {
    // Invalid credentials
    'auth/invalid-credential': 'Incorrect email or password. Please check your credentials and try again.',
    'auth/wrong-password': 'Incorrect email or password. Please check your credentials and try again.',
    'auth/user-not-found': 'Incorrect email or password. Please check your credentials and try again.',
    'auth/invalid-email': 'Please enter a valid email address.',
    
    // Account issues
    'auth/user-disabled': 'This account has been disabled. Please contact support for assistance.',
    'auth/too-many-requests': 'Too many failed attempts. Please wait a moment and try again.',
    'auth/account-exists-with-different-credential': 'An account already exists with this email address. Please try signing in instead.',
    
    // Network/Server issues
    'auth/network-request-failed': 'Network error. Please check your connection and try again.',
    'auth/operation-not-allowed': 'This sign-in method is not enabled. Please contact support.',
    'auth/weak-password': 'Password is too weak. Please choose a stronger password.',
    
    // Email verification
    'auth/email-already-in-use': 'An account with this email already exists. Please try signing in instead.',
    'auth/requires-recent-login': 'For security reasons, please sign in again to complete this action.',
    
    // Generic fallbacks
    'auth/invalid-argument': 'Invalid information provided. Please check your input and try again.',
    'auth/invalid-user-token': 'Your session has expired. Please sign in again.',
    'auth/user-token-expired': 'Your session has expired. Please sign in again.',
  };
  
  // Check for exact code match first
  if (errorMessages[errorCode]) {
    return errorMessages[errorCode];
  }
  
  // Check if it's a Firebase error with the auth/ prefix
  if (errorCode.includes('auth/')) {
    return 'Authentication failed. Please check your credentials and try again.';
  }
  
  // Check for common error patterns in the message
  const message = error?.message || errorCode;
  if (message.includes('invalid-credential') || 
      message.includes('wrong-password') || 
      message.includes('user-not-found')) {
    return 'Incorrect email or password. Please check your credentials and try again.';
  }
  
  if (message.includes('email-already-in-use')) {
    return 'An account with this email already exists. Please try signing in instead.';
  }
  
  if (message.includes('weak-password')) {
    return 'Password is too weak. Please choose a stronger password.';
  }
  
  if (message.includes('network') || message.includes('connection')) {
    return 'Network error. Please check your connection and try again.';
  }
  
  // Generic fallback for any other errors
  return 'Something went wrong. Please try again or contact support if the problem persists.';
}
