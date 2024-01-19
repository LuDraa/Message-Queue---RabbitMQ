import * as express from 'express'
import * as cors from 'cors'
import { DataSource } from "typeorm"
import { Request, Response } from 'express'
import { Product } from './entity/product'
import { channel } from 'diagnostics_channel'
import * as amqp from 'amqplib/callback_api'
import { error } from 'console'
import { Connection } from 'mysql2/typings/mysql/lib/Connection'

const AppDataSource = new DataSource({
    type: "mysql",
    host: "localhost",
    port: 3306,
    username: "root",
    password: "shardul12",
    database: "rab",
    entities: [
        "src/entity/*.js"
    ],
    logging: false,
    synchronize: true
})

AppDataSource.initialize()
    .then(() => {

        amqp.connect('amqp://localhost', (error0, connection) => {
            if (error0) {
                throw error0
            }
            
            
            connection.createChannel((error1, channel) => {
                if (error1) {
                    throw error1
                }

                const app = express()
                const productRepo = AppDataSource.getRepository(Product)
                app.use(cors({
                    origin: ['http://localhost:3000']
                }))

                app.use(express.json())
                console.log("Listening to port 8000")
                app.listen(8000)

                app.get('/api/products', async (req: Request, res: Response) => {
                    const products = await productRepo.find()
                    channel.sendToQueue('LuDraa', Buffer.from('Hello bro'));
                    res.send(products)
                })

                app.post('/api/products', async (req: Request, res: Response) => {
                    console.log(req.body)
                    const products = await productRepo.create(req.body)
                    const result = await productRepo.save(products)
                    channel.sendToQueue('Created', Buffer.from(JSON.stringify(result)))
                    return res.send(result);

                })

                app.get('/api/products/:id', async (req: Request, res: Response) => {
                    const productId = parseInt(req.params.id, 10);
                    const product = await productRepo.findOne({ where: { id: productId } })
                    return res.send(product)
                })

                app.put('/api/products/:id', async (req: Request, res: Response) => {
                    const productId = parseInt(req.params.id, 10);
                    const product = await productRepo.findOne({ where: { id: productId } })
                    productRepo.merge(product, req.body)
                    const result = await productRepo.save(product)
                    channel.sendToQueue('product_updated', Buffer.from(JSON.stringify(result)))
                    return res.send(result)
                })

                app.delete('/api/products/:id', async (req: Request, res: Response) => {
                    const result = await productRepo.delete(req.params.id)
                    channel.sendToQueue('product_deleted', Buffer.from(req.params.id))
                    return res.send(result)
                })

                app.post('/api/products/:id/like', async (req: Request, res: Response) => {
                    const productId = parseInt(req.params.id, 10);
                    const product = await productRepo.findOne({ where: { id: productId } })
                    product.likes++
                    const result = await productRepo.save(product)
                    return res.send(result)

                })

            })
        })

    })
    .catch((err) => {
        console.error("Error during Data Source initialization", err)
    })