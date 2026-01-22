const amqp = require('amqplib/callback_api');

/**
 * RabbitMQClient Class handles individual connections to a RabbitMQ server.
 * It features automatic queue prefixing and reconnection logic.
 */
class RabbitMQClient {
    #connection = null;
    #channel = null;
    #isConnected = false;
    #pendingOperations = [];
    #activeConsumers = new Map();
    #config;
    #logger;
    #prefix;

    constructor(config, logger) {
        this.#config = config;
        this.#logger = logger;
        // Set an empty string if no prefix is provided to avoid "undefined" in names
        this.#prefix = config.queuePrefix ? `${config.queuePrefix}:` : '';
    }

    /**
     * Appends the pre-configured prefix to the given queue name.
     * @param {string} queueName - The original name of the queue.
     * @returns {string} The prefixed queue name.
     */
    #getPrefixedName(queueName) {
        return `${this.#prefix}${queueName}`;
    }

    /**
     * Initializes the connection and sets up automatic reconnection on failure.
     */
    connect() {
        const { host, port, username, password, connectionName = 'default' } = this.#config;
        const connectionString = `amqp://${username}:${password}@${host}:${port}`;

        this.#logger.log(`[RabbitMQ - ${connectionName}] Attempting to connect to the server...`);

        amqp.connect(connectionString, (err, conn) => {
            if (err) {
                this.#logger.error(`[RabbitMQ - ${connectionName}] Connection failed! Retrying in 5 seconds...`, err.message);
                return setTimeout(() => this.connect(), 5000);
            }

            this.#connection = conn;

            this.#connection.on('error', (err) => {
                if (err.message !== 'Connection closing') {
                    this.#logger.error(`[RabbitMQ - ${connectionName}] Connection error event:`, err.message);
                }
            });

            this.#connection.on('close', () => {
                this.#isConnected = false;
                this.#logger.error(`[RabbitMQ - ${connectionName}] Connection lost. Reconnecting in 5 seconds...`);
                return setTimeout(() => this.connect(), 5000);
            });

            this.#connection.createChannel((err, ch) => {
                if (err) {
                    this.#logger.error(`[RabbitMQ - ${connectionName}] Failed to create channel!`, err.message);
                    return;
                }
                this.#channel = ch;
                this.#isConnected = true;
                this.#logger.log(`[RabbitMQ - ${connectionName}] Connection and Channel are ready.`);

                this.#processPendingOperations();
                this.#rebindConsumers();
            });
        });
    }

    /**
     * Publishes a message to a prefixed queue.
     */
    publishToQueue(queue, message) {
        const fullQueueName = this.#getPrefixedName(queue);
        this.#ensureConnection(() => {
            this.#channel.assertQueue(fullQueueName, { durable: true });
            this.#channel.sendToQueue(fullQueueName, Buffer.from(message), { persistent: true });
            this.#logger.log(`[${this.#config.connectionName}] Message dispatched to: ${fullQueueName}`);
        });
    }

    /**
     * Consumes messages from a prefixed queue.
     */
    consumeFromQueue(queue, onMessage, options = { prefetch: 1 }) {
        // We store the original queue name as the key, but use the prefixed name for the actual subscription
        this.#activeConsumers.set(queue, { onMessage, options });
        this.#ensureConnection(() => this.#subscribe(queue, onMessage, options));
    }

    /**
     * Closes the connection manually.
     */
    closeConnection() {
        if (this.#connection) {
            this.#connection.removeAllListeners('close');
            this.#connection.close();
            this.#isConnected = false;
            this.#logger.log(`[${this.#config.connectionName}] Connection closed manually.`);
        }
    }

    // --- Private Methods ---

    #ensureConnection(operation) {
        if (this.#isConnected && this.#channel) {
            operation();
        } else {
            this.#pendingOperations.push(operation);
        }
    }

    #subscribe(queue, onMessage, options) {
        const fullQueueName = this.#getPrefixedName(queue);
        this.#channel.assertQueue(fullQueueName, { durable: true });
        this.#channel.prefetch(options.prefetch || 1);
        this.#channel.consume(fullQueueName, async (msg) => {
            if (msg !== null) {
                try {
                    const result = await onMessage(msg.content.toString());
                    if (result && result.success) {
                        this.#channel.ack(msg);
                    } else {
                        this.#channel.nack(msg, false, true);
                    }
                } catch (error) {
                    this.#logger.error(`[${this.#config.connectionName}] Worker Error [${fullQueueName}]:`, error.message);
                    this.#channel.nack(msg, false, true);
                }
            }
        });
    }

    #rebindConsumers() {
        this.#activeConsumers.forEach((config, queue) => {
            this.#logger.log(`[${this.#config.connectionName}] Re-establishing consumer for: ${this.#getPrefixedName(queue)}`);
            this.#subscribe(queue, config.onMessage, config.options);
        });
    }

    #processPendingOperations() {
        while (this.#pendingOperations.length > 0) {
            const operation = this.#pendingOperations.shift();
            operation();
        }
    }
}

/**
 * Service Factory for managing multiple RabbitMQ clients.
 */
const makeRabbitMQService = ({ logger }) => {
    const clients = new Map();

    const createRabbitMQClient = (config) => {
        const name = config.connectionName || 'default';
        if (clients.has(name)) return clients.get(name);

        const client = new RabbitMQClient(config, config.logger);
        clients.set(name, client);
        return client;
    };

    return Object.freeze({ createRabbitMQClient });
};

module.exports = { makeRabbitMQService };