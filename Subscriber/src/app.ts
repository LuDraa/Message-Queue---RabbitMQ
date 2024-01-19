import { DataSource } from "typeorm";
import * as express from 'express'
import * as cors from 'cors'
import * as amqp from 'amqplib/callback_api'
import { Product } from "./entity/product";

const AppDataSource = new DataSource({
    type: "mongodb",
    host: "localhost",
    database: "rab_main",
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

            const productRepo = AppDataSource.getRepository(Product)
            connection.createChannel((error1, channel) => {

                channel.assertQueue('Created', { durable: false }, (err, ok) => {
                    if (err) {
                        console.error(err);
                    } else {
                        console.log('Queue created successfully:', ok.queue);
                    }
                });

                channel.assertQueue('Updated', { durable: false }, (err, ok) => {
                    if (err) {
                        console.error(err);
                    } else {
                        console.log('Queue created successfully:', ok.queue);
                    }
                });

                channel.assertQueue('Deleted', { durable: false }, (err, ok) => {
                    if (err) {
                        console.error(err);
                    } else {
                        console.log('Queue created successfully:', ok.queue);
                    }
                });

                channel.assertQueue('LuDraa', { durable: false }, (err, ok) => {
                    if (err) {
                        console.error(err);
                    } else {
                        console.log('Queue created successfully:', ok.queue);
                    }
                });
                
                if (error1) {
                    throw error1
                }

                channel.consume('LuDraa', async (msg) => {
                    
                })

                channel.consume('Created', async (msg) => {
                    const incomingProduct:Product = JSON.parse(msg.content.toString())
                    console.log(incomingProduct)
                    const newProduct = new Product()
                    newProduct.admin_id = parseInt(incomingProduct.id)
                    newProduct.title = incomingProduct.title
                    newProduct.image = incomingProduct.image
                    newProduct.likes = incomingProduct.likes
                    await productRepo.save(newProduct)
                },{noAck: true})

                channel.consume('Updated', async (msg) => {

                    const eventProduct: Product = JSON.parse(msg.content.toString())
                    const productId = parseInt(eventProduct.id);
                    const product = await productRepo.findOne( 
                        {where : {admin_id: productId}}
                    )
                    productRepo.merge(product, {
                    title: eventProduct.title,
                    image: eventProduct.image,
                    likes: eventProduct.likes
                })
                await productRepo.save(product)
                },{noAck: true})

                channel.consume('Deleted', async (msg) => {
                    const admin_id = parseInt(msg.content.toString());
                
                    await productRepo.delete({ admin_id: admin_id });
                }, { noAck: true });

                const app = express()
                app.use(cors({
                    origin: ['http://localhost:4000']
                }))

                app.use(express.json())

                
                console.log("Listening to port 8001")
                app.listen(8001)
            })
        })
    })
