import { Question, QuestionSet } from 'nest-commander';

/**
 * The question set for the action to perform.
 */
@QuestionSet({ name: 'action-question' })
export class ActionQuestion {
  /**
   * Parses the action from the user's input.
   * @param val The value of the user's input.
   * @returns The parsed action.
   */
  @Question({
    message: 'What is the action you want to perform? (e.g., check, fix)',
    name: 'action',
  })
  parseAction(val: string): string {
    return val;
  }
}

/**
 * The question set for the name of the entity.
 */
@QuestionSet({ name: 'name-question' })
export class NameQuestion {
  /**
   * Parses the name from the user's input.
   * @param val The value of the user's input.
   * @returns The parsed name.
   */
  @Question({
    message: 'What is the name of the entity?',
    name: 'name',
  })
  parseName(val: string): string {
    return val;
  }
}
