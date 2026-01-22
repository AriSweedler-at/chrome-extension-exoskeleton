export class Commands {
    /**
     * Get all registered keyboard commands
     */
    static async getAll(): Promise<chrome.commands.Command[]> {
        return new Promise((resolve) => {
            chrome.commands.getAll((commands) => {
                resolve(commands);
            });
        });
    }

    /**
     * Register a listener for keyboard commands
     */
    static onCommand(callback: (command: string) => void): void {
        chrome.commands.onCommand.addListener(callback);
    }
}
