import { createSignal, Match, Switch } from "solid-js";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";
import pixelHeart1 from "./assets/pixel_heart.png";
import pixelHeart2 from "./assets/pixel_heart2.png";
import kittySuccess from "./assets/hello_kitty_success.gif";
import kittyNo from "./assets/kitty_no.gif";
import kittyPause from "./assets/kitty_pause.gif";
import kittyStart from "./assets/kitty_run.gif";
import { TimerDisplay } from "./components/TimerDisplay";
import { ControlsButtons } from "./components/ControlsButtons";
import { ModalStop } from "./components/ModalStop";

interface TimerState {
    total_duration: number;
    is_running: boolean;
    start_time: null | string;
    pause_start: null | string;
    pause_duration: number;
    deals_count: number;
}

function App() {
    const [timerState, setTimerState] = createSignal<TimerState>({
        total_duration: 0,
        is_running: false,
        start_time: null,
        pause_start: null,
        pause_duration: 0,
        deals_count: 0,
    });
    const [modalOpen, setModalOpen] = createSignal(false);
    const [showKittySuccess, setShowKittySuccess] = createSignal(false);
    const [showKittyNo, setShowKittyNo] = createSignal(false);

    const updateTimerState = async () => {
        const state = await invoke<TimerState>("get_timer_state");
        setTimerState(state);
    };

    const stopTimer = async () => {
        try {
            const [workTime, pauseTime, dealsCount] = await invoke<[number, number, number]>("stop_timer");
            console.log(`Отчет: Работа - ${workTime}с, Перерыв - ${pauseTime}с, Сделок - ${dealsCount}`);
            await updateTimerState();
            setModalOpen(false);
        } catch (error) {
            console.error("Ошибка остановки:", error);
        }
    };

    const handleOnCancel = () => {
        setModalOpen(false);
        setShowKittyNo(true);
        setTimeout(() => setShowKittyNo(false), 3000);
    };

    const handleIncrementDeals = async () => {
        try {
            await invoke<string>("increment_deals");
            await updateTimerState();
            setShowKittySuccess(true);
            setTimeout(() => setShowKittySuccess(false), 3000);
        } catch (error) {
            console.error("Ошибка сделки:", error);
        }
    };

    updateTimerState();

    return (
        <main class="container">
            <header>
                <img src={pixelHeart1} alt="heart" class="heart" />
                <h1>Таймер</h1>
                <img src={pixelHeart2} alt="heart" class="heart" />
            </header>

            <Switch>
                <Match when={showKittySuccess()}>
                    <img src={kittySuccess} alt="success" class="kitty-success"  />
                </Match>
                <Match when={showKittyNo()}>
                    <img src={kittyNo} alt="no" class="kitty-no"  />
                </Match>
                <Match when={timerState().is_running}>
                    <img src={kittyStart} alt="start" class="kitty-success" />
                </Match>
                <Match when={timerState().pause_start}>
                    <img src={kittyPause} alt="pause" class="kitty-pause" />
                </Match>
            </Switch>

            <TimerDisplay timerState={timerState} />
            <ControlsButtons
                timerState={timerState}
                onUpdate={updateTimerState}
                onStopRequest={() => setModalOpen(true)}
                onIncrementDeals={handleIncrementDeals}
            />
            <ModalStop isOpen={modalOpen()} onConfirm={stopTimer} onCancel={handleOnCancel} />
        </main>
    );
}

export default App;