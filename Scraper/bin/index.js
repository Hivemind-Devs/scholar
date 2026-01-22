#!/usr/bin/env node

const path = require('path');
const fs = require('fs');

/**
 * Configuration loader
 * Loads configuration based on environment argument
 */
class ConfigLoader {
    constructor() {
        this.configDir = __dirname;
        this.environment = this.resolveEnvironment(); // <-- parse & validate once
        this.config = this.loadConfig();
    }

    /**
     * Resolve environment from CLI args/env vars and validate it.
     * @returns {string} Environment name
     */
    resolveEnvironment() {
        console.log('🔧 resolveEnvironment');
        const args = process.argv.slice(2);

        // Look for --env=value or --environment=value
        let env = null;

        for (let i = 0; i < args.length; i++) {
            const arg = args[i];
            if (arg.startsWith('--env=')) {
                env = arg.split('=')[1];
                break;
            } else if (arg.startsWith('--environment=')) {
                env = arg.split('=')[1];
                break;
            } else if (arg === '--env' && i + 1 < args.length) {
                env = args[i + 1];
                break;
            } else if (arg === '--environment' && i + 1 < args.length) {
                env = args[i + 1];
                break;
            }
        }

        // Fallback to environment variable or default
        if (!env) {
            env = process.env.NODE_ENV || 'development';
        }

        // Normalize & validate environment
        env = String(env).toLowerCase();
        if (!['development', 'production'].includes(env)) {
            console.error(`❌ Invalid environment: ${env}. Must be 'development' or 'production'`);
            process.exit(1);
        }

        console.log(`🔧 Environment: ${env}`);
        return env;
    }

    /**
     * Load configuration file
     * @returns {Object} Configuration object
     */
    loadConfig() {
        const configFile = path.join(this.configDir, `config.${this.environment}.json`);

        if (!fs.existsSync(configFile)) {
            console.error(`❌ Configuration file not found: ${configFile}`);
            console.error('Available environments: development, production');
            process.exit(1);
        }

        try {
            const configData = fs.readFileSync(configFile, 'utf8');
            const config = JSON.parse(configData);

            console.log(`✅ Configuration loaded: ${this.environment}`);
            console.log(`📁 Config file: ${configFile}`);
            console.log('');

            return config;
        } catch (error) {
            console.error(`❌ Error loading configuration: ${error.message}`);
            process.exit(1);
        }
    }

    /**
     * Get configuration value by path
     * @param {string} path - Dot notation path (e.g., 'api.openai.model')
     * @returns {*} Configuration value
     */
    get(path) {
        return path.split('.').reduce((obj, key) => obj?.[key], this.config);
    }

    /**
     * Get full configuration object
     * @returns {Object} Full configuration
     */
    getAll() {
        return this.config;
    }

    /**
     * Get current environment (cached)
     * @returns {string} Environment name
     */
    getEnvironment() {
        return this.environment;
    }

    /**
     * Check if environment is production
     * @returns {boolean} Is production environment
     */
    isProduction() {
        return this.environment === 'production';
    }

    /**
     * Check if environment is development
     * @returns {boolean} Is development environment
     */
    isDevelopment() {
        return this.environment === 'development';
    }
}

// Export singleton instance
const configLoader = new ConfigLoader();

module.exports = {
    ConfigLoader,
    config: configLoader,
    get: (path) => configLoader.get(path),
    getAll: () => configLoader.getAll(),
    getEnvironment: () => configLoader.getEnvironment(),
    isProduction: () => configLoader.isProduction(),
    isDevelopment: () => configLoader.isDevelopment()
};

// If this file is run directly, show configuration info
if (require.main === module) {
    console.log('🔧 Hivemind Scraper Configuration');
    console.log('==============================');
    console.log(`Environment: ${configLoader.getEnvironment()}`);
    console.log('==============================');
}