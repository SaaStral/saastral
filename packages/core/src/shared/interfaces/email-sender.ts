export interface SendEmailOptions {
  to: string | string[]
  subject: string
  html: string
}

export interface EmailSenderInterface {
  send(options: SendEmailOptions): Promise<void>
}
