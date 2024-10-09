import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import db from "@repo/db/client";
function agecalc(DOB: Date) {
    const currentDate = new Date();
    let age = currentDate.getFullYear() - DOB.getFullYear();
    const monthDifference = currentDate.getMonth() - DOB.getMonth();
    if (monthDifference < 0 || (monthDifference === 0 && currentDate.getDate() < DOB.getDate())) age--;
    return age;
}
export const authOptions = {
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                email: { label: "Email", type: "email", placeholder: "xyz@gmail.com" },
                username: { label: "Username", type: "text", placeholder: "unique username" },
                name: { label: "Fullname", type: "text", placeholder: "xyz" },
                DateOfBirth: { label: "Date Of Birth", type: "date", placeholder: "xyz@gmail.com" },
                password: { label: "Password", type: "password" },
            },
            type: "credentials",
            async authorize(credentials: any) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }
                const existingUser = await db.user.findUnique({
                    where: {
                        email: credentials.email
                    },
                });

                if (existingUser) {
                    const passwordValidation = await bcrypt.compare(
                        credentials.password,
                        existingUser.password
                    );

                    if (passwordValidation) {
                        return {
                            id: existingUser.uid
                        };
                    }
                    return null;
                }
                try {
                    if (!credentials?.email || !credentials?.password || !credentials.name || !credentials.username || !credentials.email || !credentials.DateOfBirth) {
                        return null;
                    }
                    const hasedpass = await bcrypt.hash(credentials.password, 10);
                    const dateOfBirth: Date = new Date(credentials.DateOfBirth);
                    let age = agecalc(dateOfBirth);
                    const user = await db.user.create({
                        data: {
                            email: credentials.email, password: hasedpass, name: credentials.name, username: credentials.username, DOB: dateOfBirth, createdAt: new Date(),
                            updatedAt: new Date(),
                            age: age,
                        }
                    })
                    return {
                        id: user.uid,
                        name: user.name,
                        email: user.email
                    };
                } catch (error) {
                    console.log(error);
                }
                return null;

            },
        }),
    ],
    //@ts-ignore
    secret: process.env.JWT_SECRET || "secret",
    callbacks: {
        async session({ token, session }: any) {
            if (session.user && token.sub) {
                session.user.id = token.sub;
            }

            return session;
        },
    },
};
