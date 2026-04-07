// PostHog Analytics Integration
let posthog = null;

// Initialize PostHog
export const initAnalytics = () => {
  try {
    if (import.meta.env.VITE_POSTHOG_API_KEY) {
      // Dynamically import PostHog only if API key exists
      import('posthog-js').then(({ default: PostHog }) => {
        posthog = new PostHog(import.meta.env.VITE_POSTHOG_API_KEY, {
          api_host: import.meta.env.VITE_POSTHOG_HOST || 'https://app.posthog.com',
          autocapture: true,
          capture_pageview: true,
          capture_pageleave: true,
          debug: import.meta.env.DEV
        });

        console.log('📊 PostHog analytics initialized');
      }).catch(err => {
        console.warn('PostHog not available:', err);
      });
    } else {
      console.log('📊 PostHog analytics disabled (no API key)');
    }
  } catch (error) {
    console.error('Analytics initialization error:', error);
  }
};

// Track custom events
export const trackEvent = (eventName, properties = {}) => {
  if (posthog) {
    posthog.capture(eventName, properties);
    console.log('📊 Event tracked:', eventName, properties);
  }
};

// Track page views
export const trackPageView = (pageName, properties = {}) => {
  if (posthog) {
    posthog.capture('$pageview', {
      page: pageName,
      ...properties
    });
    console.log('📊 Page view tracked:', pageName);
  }
};

// Track user engagement
export const trackEngagement = (action, details = {}) => {
  if (posthog) {
    posthog.capture('user_engagement', {
      action,
      ...details
    });
    console.log('📊 Engagement tracked:', action, details);
  }
};

// Track feature usage
export const trackFeatureUsage = (featureName, properties = {}) => {
  if (posthog) {
    posthog.capture('feature_used', {
      feature: featureName,
      ...properties
    });
    console.log('📊 Feature usage tracked:', featureName, properties);
  }
};

// Track conversion events
export const trackConversion = (conversionType, properties = {}) => {
  if (posthog) {
    posthog.capture('conversion', {
      type: conversionType,
      ...properties
    });
    console.log('📊 Conversion tracked:', conversionType, properties);
  }
};

// Track errors
export const trackError = (errorType, errorDetails = {}) => {
  if (posthog) {
    posthog.capture('error', {
      type: errorType,
      ...errorDetails
    });
    console.log('📊 Error tracked:', errorType, errorDetails);
  }
};

// Set user properties
export const setUserProperties = (properties) => {
  if (posthog) {
    posthog.people.set(properties);
    console.log('📊 User properties set:', properties);
  }
};

// Identify user
export const identifyUser = (userId, properties = {}) => {
  if (posthog) {
    posthog.identify(userId, properties);
    console.log('📊 User identified:', userId, properties);
  }
};

// Reset user
export const resetUser = () => {
  if (posthog) {
    posthog.reset();
    console.log('📊 User reset');
  }
};

export { posthog };
