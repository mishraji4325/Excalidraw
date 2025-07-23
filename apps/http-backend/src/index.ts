import  express from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '@repo/backend-common/config';
import { middleware } from './middleware';
import {CreateUserSchema, CreateRoomSchema, SigninSchema} from "@repo/common/types";
import { prismaClient } from '@repo/db/src';

const app = express();
app.use(express.json());

app.post('/signup',async (req, res)=>{

    const parsedData = CreateUserSchema.safeParse(req.body);
    if(!parsedData.success){
        res.json({
            message:"incorrect inputs"
        })
        return ;
    }
    try{
        const user = await prismaClient.user.create({
        data:{
            email:parsedData.data?.username,
            password:parsedData.data.password,
            name:parsedData.data.name
        }
    })

    //db call
    res.json({
        userId:user.id
    })
    }catch(e){
        res.status(411).json({
            message:"user already exists"
        })
    }
    
    
})
app.post('/signin',async(req, res)=>{

    const parsedData = SigninSchema.safeParse(req.body);
    if(!parsedData.success){
        res.json({
            message:"incorrect inputs"
        })
        return ;
    }

    //TODO: compare the hashed password here after completing the program;
    const user = await prismaClient.user.findFirst({
        where:({
            email:parsedData.data.username,
            password:parsedData.data.password
        })
    })

    if(!user){
        res.status(403).json({
            message:"not authorized"
        })
        return;
    }
    
    const token = jwt.sign({
        userId:user?.id
    }, JWT_SECRET);
    
    res.json({
        token
    })
})
app.post('/room', middleware,async(req, res)=>{
    const parsedData = CreateRoomSchema.safeParse(req.body);
    if(!parsedData.success){
        res.json({
            message:"incorrect inputs"
        })
        return ;
    }

   
   try{
     // @ts-ignore : TODO fix here req.userid
     const userId = req.userId;

    const room = await prismaClient.room.create({
        data:{
            slug:parsedData.data.name,
            adminId:userId
        }
    })


    //db call
    res.json({
        roomId:room.id
    })
   }catch(e){
    res.status(421).json({
        message:"room already exists"
    })
   }
    
})

app.get('/chats/:roomId', async(req, res)=>{
    const roomId = Number(req.params.roomId);
    const messages = await prismaClient.chat.findMany({
        where:{
            roomId:roomId
        },
        take:50
    });
    res.json({
        messages
    })
})

app.listen(3001);