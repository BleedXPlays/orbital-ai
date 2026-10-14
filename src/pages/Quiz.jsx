import { useMemo, useState } from "react";
import { apiFetch, getApiErrorMessage } from "../services/apiClient";
import { buildQuizPrompt, parseQuizResponse } from "../utils/quiz";

const difficultyOptions = [
  ["easy", "Easy", "Clear recall and foundation questions"],
  ["medium", "Medium", "A balanced mix of recall and application"],
  ["hard", "Hard", "Deeper reasoning and close alternatives"],
];

const letters = ["A", "B", "C", "D"];

function Quiz() {
  const [form, setForm] = useState({ topic: "", classLevel: "", book: "", chapter: "", difficulty: "medium", questionCount: 5 });
  const [quiz, setQuiz] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [phase, setPhase] = useState("setup");
  const [error, setError] = useState("");

  const score = useMemo(
    () => answers.reduce((total, answer, index) => total + (answer === quiz?.questions[index]?.correctIndex ? 1 : 0), 0),
    [answers, quiz]
  );

  const updateField = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const createQuiz = async (event) => {
    event.preventDefault();
    if (!form.topic.trim()) {
      setError("Please enter the topic you want to study.");
      return;
    }

    setError("");
    setPhase("generating");

    try {
      const response = await apiFetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: buildQuizPrompt(form),
          tasks: [{ ai: "OpenAI", task: "General Answer" }],
          outputs: [["✦", "Quiz Data", "Valid JSON containing the complete interactive quiz"]],
          conversationHistory: [],
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(getApiErrorMessage(data, "The quiz could not be generated."));

      const quizOutput = data.generatedOutputs?.find((item) => item?.title === "Quiz Data");
      const nextQuiz = parseQuizResponse(quizOutput?.content || data.reply, form.questionCount);
      setQuiz(nextQuiz);
      setAnswers([]);
      setCurrentIndex(0);
      setPhase("playing");
    } catch (requestError) {
      setError(requestError.message || "The quiz could not be generated. Please try again.");
      setPhase("setup");
    }
  };

  const chooseAnswer = (optionIndex) => {
    if (answers[currentIndex] !== undefined) return;
    setAnswers((current) => {
      const next = [...current];
      next[currentIndex] = optionIndex;
      return next;
    });
  };

  const moveNext = () => {
    if (currentIndex === quiz.questions.length - 1) setPhase("results");
    else setCurrentIndex((index) => index + 1);
  };

  const resetToSetup = () => {
    setQuiz(null);
    setAnswers([]);
    setCurrentIndex(0);
    setPhase("setup");
    setError("");
  };

  const restartQuiz = () => {
    setAnswers([]);
    setCurrentIndex(0);
    setPhase("playing");
  };

  const currentQuestion = quiz?.questions[currentIndex];
  const selectedAnswer = answers[currentIndex];
  const answered = selectedAnswer !== undefined;

  return (
    <div className="min-h-full px-4 py-7 text-white sm:px-7 lg:px-10 lg:py-9">
      <div className="mx-auto w-full max-w-5xl">
        <header className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-violet-300">Study tools</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Quiz Studio</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Turn any chapter or topic into an interactive quiz designed for your class level.</p>
          </div>
          {phase !== "setup" && phase !== "generating" && (
            <button type="button" onClick={resetToSetup} className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-slate-300 transition hover:bg-white/[0.08] hover:text-white">Create another quiz</button>
          )}
        </header>

        {phase === "setup" || phase === "generating" ? (
          <form onSubmit={createQuiz} className="relative overflow-hidden rounded-[28px] border border-blue-200/[0.16] bg-[linear-gradient(145deg,rgba(10,25,50,0.88),rgba(4,11,28,0.93))] p-5 shadow-[0_28px_80px_rgba(0,0,0,0.38)] backdrop-blur-2xl sm:p-7">
            <div aria-hidden="true" className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-violet-500/10 blur-3xl" />
            <div className="relative grid gap-5 sm:grid-cols-2">
              <label className="sm:col-span-2"><span className="mb-2 block text-sm font-semibold text-slate-200">Topic <span className="text-violet-300">*</span></span><input required value={form.topic} onChange={(e) => updateField("topic", e.target.value)} placeholder="For example: Photosynthesis" className="w-full rounded-2xl border border-blue-200/[0.14] bg-[#061124]/80 px-4 py-3.5 text-sm outline-none transition placeholder:text-slate-600 focus:border-violet-400/45 focus:ring-2 focus:ring-violet-400/10" /></label>
              <label><span className="mb-2 block text-sm font-semibold text-slate-200">Class or grade</span><input value={form.classLevel} onChange={(e) => updateField("classLevel", e.target.value)} placeholder="For example: Class 8" className="w-full rounded-2xl border border-blue-200/[0.14] bg-[#061124]/80 px-4 py-3.5 text-sm outline-none transition placeholder:text-slate-600 focus:border-violet-400/45" /></label>
              <label><span className="mb-2 block text-sm font-semibold text-slate-200">Book</span><input value={form.book} onChange={(e) => updateField("book", e.target.value)} placeholder="Book name (optional)" className="w-full rounded-2xl border border-blue-200/[0.14] bg-[#061124]/80 px-4 py-3.5 text-sm outline-none transition placeholder:text-slate-600 focus:border-violet-400/45" /></label>
              <label className="sm:col-span-2"><span className="mb-2 block text-sm font-semibold text-slate-200">Chapter</span><input value={form.chapter} onChange={(e) => updateField("chapter", e.target.value)} placeholder="Chapter name or number (optional)" className="w-full rounded-2xl border border-blue-200/[0.14] bg-[#061124]/80 px-4 py-3.5 text-sm outline-none transition placeholder:text-slate-600 focus:border-violet-400/45" /></label>
            </div>

            <fieldset className="relative mt-7"><legend className="text-sm font-semibold text-slate-200">Difficulty</legend><div className="mt-3 grid gap-2.5 sm:grid-cols-3">{difficultyOptions.map(([value, label, description]) => <button key={value} type="button" aria-pressed={form.difficulty === value} onClick={() => updateField("difficulty", value)} className={`rounded-2xl border p-3.5 text-left transition ${form.difficulty === value ? "border-violet-400/55 bg-violet-500/[0.14] shadow-[inset_0_0_22px_rgba(139,92,246,0.08)]" : "border-white/[0.08] bg-white/[0.025] hover:bg-white/[0.05]"}`}><span className="block text-sm font-semibold text-white">{label}</span><span className="mt-1 block text-xs leading-5 text-slate-500">{description}</span></button>)}</div></fieldset>

            <fieldset className="relative mt-7"><legend className="text-sm font-semibold text-slate-200">Number of questions</legend><div className="mt-3 flex gap-2.5">{[5, 10, 20].map((count) => <button key={count} type="button" aria-pressed={form.questionCount === count} onClick={() => updateField("questionCount", count)} className={`min-w-16 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${form.questionCount === count ? "border-blue-300/50 bg-blue-500/15 text-blue-100" : "border-white/[0.08] bg-white/[0.025] text-slate-400 hover:text-white"}`}>{count}</button>)}</div><p className="mt-2 text-xs text-slate-600">Maximum 20 questions per quiz.</p></fieldset>

            {error && <p role="alert" className="relative mt-5 rounded-xl border border-red-400/20 bg-red-500/[0.08] px-4 py-3 text-sm text-red-200">{error}</p>}
            <button disabled={phase === "generating"} className="relative mt-7 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-3.5 text-sm font-bold shadow-[0_14px_36px_rgba(76,70,229,0.25)] transition hover:brightness-110 disabled:cursor-wait disabled:opacity-70">{phase === "generating" ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/25 border-t-white" /> Building your quiz…</> : <>✦ Create quiz</>}</button>
          </form>
        ) : phase === "playing" && currentQuestion ? (
          <section className="overflow-hidden rounded-[28px] border border-blue-200/[0.16] bg-[linear-gradient(145deg,rgba(9,23,47,0.92),rgba(4,11,27,0.96))] shadow-[0_28px_80px_rgba(0,0,0,0.4)] backdrop-blur-2xl">
            <div className="border-b border-white/[0.07] px-5 py-5 sm:px-7"><div className="flex items-center justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-300">{quiz.title}</p><p className="mt-1 text-sm text-slate-500">Question {currentIndex + 1} of {quiz.questions.length}</p></div><span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-xs capitalize text-slate-300">{form.difficulty}</span></div><div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/[0.06]"><div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500 transition-all duration-500" style={{ width: `${((currentIndex + 1) / quiz.questions.length) * 100}%` }} /></div></div>
            <div className="p-5 sm:p-7"><h2 className="text-xl font-semibold leading-8 sm:text-2xl">{currentQuestion.question}</h2><div className="mt-6 grid gap-3">{currentQuestion.options.map((option, optionIndex) => { const isCorrect = optionIndex === currentQuestion.correctIndex; const isSelected = optionIndex === selectedAnswer; const stateClass = answered && isCorrect ? "border-emerald-400/55 bg-emerald-500/[0.12] text-emerald-50" : answered && isSelected ? "border-red-400/55 bg-red-500/[0.12] text-red-50" : "border-white/[0.09] bg-white/[0.025] text-slate-200 hover:border-violet-300/30 hover:bg-white/[0.05]"; return <button key={`${optionIndex}-${option}`} type="button" disabled={answered} onClick={() => chooseAnswer(optionIndex)} className={`flex items-center gap-3 rounded-2xl border p-3.5 text-left text-sm transition ${stateClass}`}><span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border text-xs font-bold ${answered && isCorrect ? "border-emerald-300/40 bg-emerald-400/15" : answered && isSelected ? "border-red-300/40 bg-red-400/15" : "border-white/10 bg-black/15 text-slate-400"}`}>{answered && isCorrect ? "✓" : answered && isSelected ? "×" : letters[optionIndex]}</span><span className="flex-1">{option}</span></button>; })}</div>
              {answered && <div className={`mt-5 rounded-2xl border p-4 ${selectedAnswer === currentQuestion.correctIndex ? "border-emerald-400/20 bg-emerald-500/[0.07]" : "border-amber-400/20 bg-amber-500/[0.07]"}`}><p className={`text-sm font-bold ${selectedAnswer === currentQuestion.correctIndex ? "text-emerald-300" : "text-amber-300"}`}>{selectedAnswer === currentQuestion.correctIndex ? "Correct answer" : "Not quite — here is the correct answer"}</p><p className="mt-2 text-sm leading-6 text-slate-300">{currentQuestion.explanation}</p></div>}
              <div className="mt-6 flex justify-end"><button type="button" disabled={!answered} onClick={moveNext} className="rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-3 text-sm font-bold transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-35">{currentIndex === quiz.questions.length - 1 ? "See results" : "Next question →"}</button></div>
            </div>
          </section>
        ) : phase === "results" ? (
          <section className="rounded-[28px] border border-blue-200/[0.16] bg-[linear-gradient(145deg,rgba(9,23,47,0.92),rgba(4,11,27,0.96))] p-6 text-center shadow-[0_28px_80px_rgba(0,0,0,0.4)] backdrop-blur-2xl sm:p-10"><div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[26px] border border-violet-300/25 bg-violet-500/10 text-3xl">✦</div><p className="mt-6 text-xs font-semibold uppercase tracking-[0.22em] text-violet-300">Quiz complete</p><h2 className="mt-2 text-3xl font-bold">You scored {score} out of {quiz.questions.length}</h2><p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-400">{score === quiz.questions.length ? "Excellent — you answered every question correctly." : score >= quiz.questions.length * 0.7 ? "Great work. Review the explanations for the questions you missed." : "Good attempt. Review the topic and try the quiz again to strengthen your understanding."}</p><div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row"><button type="button" onClick={restartQuiz} className="rounded-xl border border-violet-300/30 bg-violet-500/10 px-5 py-3 text-sm font-bold text-violet-100 transition hover:bg-violet-500/20">Try this quiz again</button><button type="button" onClick={resetToSetup} className="rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-3 text-sm font-bold transition hover:brightness-110">Create a new quiz</button></div></section>
        ) : null}
      </div>
    </div>
  );
}

export default Quiz;

