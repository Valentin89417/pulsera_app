import { SectionPlaceholder } from '../../components/SectionPlaceholder';

// Раздел «Тихий вопрос» — заглушка до реализации полного сценария
export default function QuietQuestionScreen() {
  return (
    <SectionPlaceholder
      title="Тихий вопрос"
      icon="question-circle"
      description="Здесь можно анонимно задать вопрос сообществу. К вопросу привязывается случайная МАК-карта из выбранной колоды."
      bullets={[
        'Анонимный вопрос и одна МАК-карта',
        'Один анонимный ответ от каждого участника',
        '7 дней в общей ленте, потом — архив в профиле',
      ]}
    />
  );
}
