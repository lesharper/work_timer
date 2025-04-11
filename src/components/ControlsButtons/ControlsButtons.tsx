import { invoke } from "@tauri-apps/api/core";
import iconStart from "../../assets/start.svg";
import iconPause from "../../assets/pause.svg";
import iconStop from "../../assets/stop.svg";

interface TimerState {
    total_duration: number;
    is_running: boolean;
    start_time: null | string;
    pause_start: null | string;
    pause_duration: number;
    deals_count: number;
}

interface ControlsButtonsProps {
    timerState: () => TimerState;
    onUpdate: () => Promise<void>;
    onStopRequest: () => void;
    onIncrementDeals: () => Promise<void>; // Добавляем пропс для сделки
}

export function ControlsButtons(props: ControlsButtonsProps) {
    const startTimer = async () => {
        try {
            await invoke<string>("start_timer");
            await props.onUpdate();
        } catch (error) {
            console.error("Ошибка старта:", error);
        }
    };

    const pauseTimer = async () => {
        try {
            await invoke<string>("pause_timer");
            await props.onUpdate();
        } catch (error) {
            console.error("Ошибка паузы:", error);
        }
    };

    return (
        <div class="row">
            <button onClick={startTimer} disabled={props.timerState().is_running}>
                <img src={iconStart} alt="start" class="button_icon" />
                <p>Начать</p>
            </button>
            <button onClick={pauseTimer} disabled={!props.timerState().is_running}>
                <img src={iconPause} alt="pause" class="button_icon" />
                <p>Перерыв</p>
            </button>
            <button onClick={props.onStopRequest}>
                <img src={iconStop} alt="stop" class="button_icon" />
                <p>Стоп</p>
            </button>
            <button onClick={props.onIncrementDeals} disabled={!props.timerState().is_running}>
                <p>Сделка</p>
            </button>
        </div>
    );
}