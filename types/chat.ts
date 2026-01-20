export type Message = {
    id: string;
    text: string;
    sender: 'user' | 'ai';
    timestamp: Date;
};

export type ChatThread = {
    id: string;
    title: string;
    messages: Message[];
    createdAt: Date;
    updatedAt: Date;
};
