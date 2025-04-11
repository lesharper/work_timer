import { createSignal, createEffect } from "solid-js";

interface TimerState {
    total_duration: number;
    is_running: boolean;
    start_time: null | string;
    pause_start: null | string;
    pause_duration: number;
    deals_count: number; // Добавляем deals_count
}

interface TimerDisplayProps {
    timerState: () => TimerState;
}

export function TimerDisplay(props: TimerDisplayProps) {
    const [workTime, setWorkTime] = createSignal(0);
    const [pauseTime, setPauseTime] = createSignal(0);

    createEffect(() => {
        const interval = setInterval(() => {
            const state = props.timerState();
            if (state.is_running && state.start_time) {
                const start = new Date(state.start_time).getTime();
                const elapsed = Math.floor((Date.now() - start) / 1000);
                setWorkTime(state.total_duration + elapsed);
            } else {
                setWorkTime(state.total_duration);
            }
            if (!state.is_running && state.pause_start) {
                const pauseStart = new Date(state.pause_start).getTime();
                const elapsedPause = Math.floor((Date.now() - pauseStart) / 1000);
                setPauseTime(state.pause_duration + elapsedPause);
            } else {
                setPauseTime(state.pause_duration);
            }
        }, 1000);
        return () => clearInterval(interval);
    });

    const formatTime = (seconds: number): string => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h.toString().padStart(2, "0")}:${m
            .toString()
            .padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    };

    return (
        <div class="timer">
            <p><span class="highlight"> Время работы: </span> {formatTime(workTime())}</p>
            <p><span class="highlight"> Статус: </span> {props.timerState().is_running ? "Работает" : "На паузе"}</p>
            {!props.timerState().is_running && props.timerState().pause_start && (
                <p><span class="highlight"> Время паузы: </span> {formatTime(pauseTime())}</p>
            )}
            <p><span class="highlight"> Сделок: </span> {props.timerState().deals_count}</p> {/* Отображаем счетчик */}
        </div>
    );
}