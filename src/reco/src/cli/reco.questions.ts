import { Question, QuestionSet } from 'nest-commander';

@QuestionSet({ name: 'action-question' })
export class ActionQuestion {
  @Question({
    message: 'What is the action you want to perform? (e.g., check, fix)',
    name: 'action',
  })
  parseAction(val: string): string {
    return val;
  }
}

@QuestionSet({ name: 'name-question' })
export class NameQuestion {
  @Question({
    message: 'What is the name of the entity?',
    name: 'name',
  })
  parseName(val: string): string {
    return val;
  }
}
