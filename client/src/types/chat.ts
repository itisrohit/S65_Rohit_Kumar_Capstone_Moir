export type Message = {
  id: number;
  text: string;
  sender: string;  // Change to string instead of union type
  time: string;
};

export type ChatData = {
  id: number;
  name: string;
  avatar: string | null;
  online: boolean;
  messages: Message[];
};