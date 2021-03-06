// Require the framework and instantiate it
import 'dotenv/config'
import Fastify from 'fastify'
import fastifyCors from 'fastify-cors'
import mqtt from 'mqtt'

// Would eventually like to packagize this
import { lightsTopics } from '../iot-broker/schema'

const fastify = Fastify({
  logger: true,
})

// Pass in allowable host names
// const CORSHosts = process.env.CORS_URLS?.split(',')

fastify.register(fastifyCors, {
  origin: (_origin, cb) => {
    cb(null, true)
    // if (origin === undefined) {
    //   cb(null, true)
    //   return
    // }

    // const hostname = new URL(origin).hostname
    // if (CORSHosts?.includes(hostname)) {
    //   //  Request from localhost will pass
    //   cb(null, true)
    //   return
    // }
    // // Generate an error on other origins, disabling access
    // cb(new Error('Not allowed'), false)
  },
})

const host = process.env.HOST || 'mqtt://localhost:1883'

const client = mqtt.connect(host, {
  clientId: 'pkirby-iot-bff',
})

client.on('connect', () => {
  console.log('Client successfully connected to ' + host)
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

const port = parseInt(process.env.PORT || '3001')

// Run the server!
const start = async () => {
  try {
    await fastify.listen({ port, host: '0.0.0.0' })
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}
start()
