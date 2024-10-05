import { NewMessage, type NewMessageEvent } from 'telegram/events';
import { ClientOptions, SessionName } from '~/constants';
import { TelegramClient } from 'telegram';
import config from '~/../config.json';
import input from 'input';

class Client extends TelegramClient {
	constructor() {
		super(SessionName, config.telegram.api.id, config.telegram.api.hash, ClientOptions);

		this.onMessage = this.onMessage.bind(this);
	}

	async initialize() {
		await this.start({
			phoneNumber: config.telegram.phone,
			password: async () => input.text('Please enter your password: '),
			phoneCode: async () => input.text('Please enter the code you received: '),
			onError: (e) => console.error('Failed to log in:', e.message),
		});

		this._log.info('Successfully logged in.');
		this.addEventHandler(this.onMessage, new NewMessage());
	}

	async onMessage(event: NewMessageEvent) {
		const text = event.message.text;
		if (!text) return;

		this._log.info(`New message from chat ${event.chatId.toString()}.`);
		if (!config.chats.includes(event.chatId.toString())) return;
		if (!text.startsWith('New deal')) return;

		console.log('Notifying for:', text);
		this.notify(text, 2);
	}

	async notify(message: string, priority: number) {
		const url = new URL('https://api.pushover.net/1/messages.json');

		url.searchParams.set('token', config.pushover.api);
		url.searchParams.set('user', config.pushover.user);
		url.searchParams.set('message', message);
		url.searchParams.set('priority', priority.toString());

		if (priority === 2) {
			url.searchParams.set('retry', '30');
			url.searchParams.set('expire', '600');
		}

		const res = await fetch(url, { method: 'POST' });
		if (!res.ok) console.error('Failed to notify pushover:', res.status, res.statusText, await res.text());
	}
}

export default new Client();