import {describe, it, expect} from 'vitest';
import React from 'react';
import {Component} from '@exo/library/components/base-component';

describe('Component', () => {
    describe('render', () => {
        it('should return ReactElement when implemented', () => {
            class TestComponent extends Component {
                render() {
                    return React.createElement('div', null, 'Test');
                }
            }

            const instance = new TestComponent();
            const result = instance.render();
            expect(result).toBeDefined();
            expect(result.type).toBe('div');
        });
    });

    describe('renderInstance', () => {
        it('should instantiate component and call render', () => {
            class TestComponent extends Component {
                render() {
                    return React.createElement('div', null, 'Hello');
                }
            }

            const result = Component.renderInstance(TestComponent);
            expect(result.type).toBe('div');
            expect(result.props.children).toBe('Hello');
        });

        it('should call onMount if defined', () => {
            let mountCalled = false;

            class TestComponent extends Component {
                onMount() {
                    mountCalled = true;
                }

                render() {
                    return React.createElement('div', null, 'Test');
                }
            }

            Component.renderInstance(TestComponent);
            expect(mountCalled).toBe(true);
        });

        it('should not error if onMount not defined', () => {
            class TestComponent extends Component {
                render() {
                    return React.createElement('div', null, 'Test');
                }
            }

            expect(() => Component.renderInstance(TestComponent)).not.toThrow();
        });
    });
});
