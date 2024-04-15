import {z} from 'zod'

const createUserSchema = z.object({
    username: z.string({required_error: "username is required"}).trim().toLowerCase(),
    email: z.string({required_error: "Email is required"}).email({ message: "Invalid email address" }),
    fullName: z.string({required_error: "Full name is required"}).url(),
    avatar: z.string({required_error:"Avatar image is required"}).url(),
    coverImage: z.string().optional(),
    password: z.string({required_error: "Password is required"}).min(5,{message: "Must be 5 or more characters long"}),
    confirmPassword: z.string({required_error: "confirmation password is required"})

}).refine((data) => data.password ===data.confirmPassword,{ message: "Password do not match",path:["password", "confirmPassword"]})