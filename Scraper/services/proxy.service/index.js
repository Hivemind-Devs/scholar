const fs = require('fs');
const path = require('path');

class ProxyService {
    constructor() {
        this.proxies = [];
        this.loadProxies();
    }

    loadProxies() {
        const proxyPath = path.join(__dirname, 'proxies.json');
        if (fs.existsSync(proxyPath)) {
            try {
                const data = fs.readFileSync(proxyPath, 'utf8');
                const rawProxies = JSON.parse(data);
                // Initialize state
                this.proxies = rawProxies.map(p => ({
                    ...p,
                    inUse: false
                }));
                console.log(`✅ Loaded ${this.proxies.length} proxies from proxies.json`);
            } catch (error) {
                console.error('❌ Error loading proxies:', error.message);
            }
        } else {
            console.warn('⚠️ proxies.json not found. Running without proxies.');
        }
    }

    /**
     * Get an available proxy that is not currently in use.
     * Marks the proxy as 'inUse' immediately.
     */
    getProxy() {
        const availableProxy = this.proxies.find(p => !p.inUse);
        
        if (availableProxy) {
            availableProxy.inUse = true;
            console.log(`🔌 Using proxy: ${availableProxy.host}:${availableProxy.port}`);
            return {
                protocol: availableProxy.protocol || 'http',
                host: availableProxy.host,
                port: availableProxy.port,
                auth: availableProxy.auth // Optional: { username: 'user', password: 'pwd' }
            };
        }
        
        if (this.proxies.length > 0) {
            console.warn('⚠️ All proxies are currently in use.');
        }
        return null;
    }

    /**
     * Release a proxy back to the pool.
     * @param {Object} proxyConfig - The proxy configuration object returned by getProxy
     */
    releaseProxy(proxyConfig) {
        if (!proxyConfig) return;
        
        const proxy = this.proxies.find(p => 
            p.host === proxyConfig.host && 
            p.port === proxyConfig.port
        );
        
        if (proxy) {
            proxy.inUse = false;
            console.log(`🔌 Released proxy: ${proxy.host}:${proxy.port}`);
        }
    }
}

module.exports = new ProxyService();

