// Require the framework and instantiate it
import 'dotenv/config'
import Fastify from 'fastify'
import fastifyCors from 'fastify-cors'
import mqtt from 'mqtt'

// Would eventually like to packagize this
import { lightsTopics } from '../iot-broker/schema'

const fastify = Fastify({ logger: true })

// Pass in allowable host names
const CORSHosts = process.env.CORS_URLS?.split(',')

fastify.register(fastifyCors, {
  origin: (origin, cb) => {
    if (origin === undefined) {
      cb(null, true)
      return
    }

    const hostname = new URL(origin).hostname
    if (CORSHosts?.includes(hostname)) {
      //  Request from localhost will pass
      cb(null, true)
      return
    }
    // Generate an error on other origins, disabling access
    cb(new Error('Not allowed'), false)

    cb(null, true)
  },
})

const client = mqtt.connect('mqtt://localhost:1883', {
  clientId: 'pkirby-iot-bff',
})

client.on('connect', () => {
  console.log('Client successfully connected')
})

client.on('message', function (topic, message) {
  // message is Buffer
  console.log(`topic: ${topic} \n message: ${message.toString()}`)
  const topicLevels = topic.split('/')
  console.log(`topic levels: ${topicLevels}`)
})

type PublishBody = {
  topic: string
  message: string
}

fastify.post('/publish', async (request, reply) => {
  const { topic, message } = request.body as PublishBody
  client.publish(topic, message)
  return `successfully published: ${topic} | ${message}`
})

// Subscribe to lights topics
client.subscribe(lightsTopics)

// Run the server!
const start = async () => {
  try {
    await fastify.listen(3001)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}
start()
