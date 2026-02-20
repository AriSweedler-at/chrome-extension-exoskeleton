import {describe, it, expect, vi} from 'vitest';
import {Commands} from '@exo/lib/service-worker/commands';
import chrome from 'sinon-chrome';

describe('Commands', () => {
    describe('getAll', () => {
        it('should get all commands from chrome.commands', async () => {
            const mockCommands = [
                {name: 'command1', description: 'Command 1'},
                {name: 'command2', description: 'Command 2'},
            ];
            chrome.commands.getAll.yields(mockCommands);

            const result = await Commands.getAll();

            expect(chrome.commands.getAll.calledOnce).toBe(true);
            expect(result).toEqual(mockCommands);
        });
    });

    describe('onCommand', () => {
        it('should register a command listener', () => {
            const callback = vi.fn();

            Commands.onCommand(callback);

            expect(chrome.commands.onCommand.addListener.calledOnce).toBe(true);
            expect(chrome.commands.onCommand.addListener.calledWith(callback)).toBe(true);
        });

        it('should call callback when command is triggered', () => {
            const callback = vi.fn();

            Commands.onCommand(callback);

            // Get the registered listener
            const listener = chrome.commands.onCommand.addListener.getCall(0).args[0];

            // Trigger the command
            listener('test-command');

            expect(callback).toHaveBeenCalledWith('test-command');
        });
    });
});
