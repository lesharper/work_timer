use chrono::{DateTime, Local};
use serde::{Deserialize, Serialize};
use std::sync::{Arc, Mutex};
use std::sync::LazyLock;
use std::fs::OpenOptions;
use std::io::Write;
use std::path::PathBuf;
use dirs;

#[derive(Clone, Serialize, Deserialize)]
struct TimerState {
    start_time: Option<DateTime<Local>>,
    total_duration: i64,
    is_running: bool,
    pause_start: Option<DateTime<Local>>,
    pause_duration: i64, // Общее время перерыва за сессию
    deals_count: u32,
}

static TIMER_STATE: LazyLock<Mutex<Arc<TimerState>>> = LazyLock::new(|| {
    Mutex::new(Arc::new(TimerState {
        start_time: None,
        total_duration: 0,
        is_running: false,
        pause_start: None,
        pause_duration: 0,
        deals_count: 0,
    }))
});

fn format_seconds(seconds: i64) -> String {
    let h = seconds / 3600;
    let m = (seconds % 3600) / 60;
    let s = seconds % 60;
    format!("{:02}:{:02}:{:02}", h, m, s)
}

#[tauri::command]
fn start_timer() -> Result<String, String> {
    let mut state = TIMER_STATE.lock().map_err(|e| e.to_string())?;
    let state = Arc::make_mut(&mut state);
    if state.is_running {
        return Err("Таймер уже запущен".to_string());
    }
    if let Some(pause_start) = state.pause_start {
        let pause_duration = Local::now().signed_duration_since(pause_start);
        state.pause_duration += pause_duration.num_seconds(); // Добавляем время предыдущего перерыва
    }
    state.start_time = Some(Local::now());
    state.is_running = true;
    state.pause_start = None;
    Ok("Таймер запущен".to_string())
}

#[tauri::command]
fn pause_timer() -> Result<String, String> {
    let mut state = TIMER_STATE.lock().map_err(|e| e.to_string())?;
    let state = Arc::make_mut(&mut state);
    if !state.is_running {
        return Err("Таймер не запущен".to_string());
    }
    if let Some(start) = state.start_time {
        let duration = Local::now().signed_duration_since(start);
        state.total_duration += duration.num_seconds();
    }
    state.is_running = false;
    state.start_time = None;
    state.pause_start = Some(Local::now());
    Ok("Таймер на паузе".to_string())
}

#[tauri::command]
fn increment_deals() -> Result<String, String> {
    let mut state = TIMER_STATE.lock().map_err(|e| e.to_string())?;
    let state = Arc::make_mut(&mut state);
    state.deals_count += 1;
    Ok(format!("Сделка добавлена. Текущий счет: {}", state.deals_count))
}

#[tauri::command]
fn stop_timer() -> Result<(i64, i64, u32), String> {
    let mut state = TIMER_STATE.lock().map_err(|e| e.to_string())?;
    let state = Arc::make_mut(&mut state);
    let mut total_work_seconds = state.total_duration;
    let mut total_pause_seconds = state.pause_duration;
    let deals_count = state.deals_count;

    if state.is_running {
        if let Some(start) = state.start_time {
            let duration = Local::now().signed_duration_since(start);
            total_work_seconds += duration.num_seconds();
        }
    } else if let Some(pause_start) = state.pause_start {
        let pause_duration = Local::now().signed_duration_since(pause_start);
        total_pause_seconds += pause_duration.num_seconds();
    }

    let now = Local::now();
    let formatted_date = now.format("%d.%m").to_string();
    let report = format!(
        "Дата: {}\nВремя работы: {}\nВремя перерыва: {}\nЦелевых сделок совершено: {}\n\n",
        formatted_date,
        format_seconds(total_work_seconds),
        format_seconds(total_pause_seconds),
        deals_count
    );

    let desktop_path = dirs::desktop_dir().ok_or("Не удалось определить путь к рабочему столу")?;
    let file_path: PathBuf = desktop_path.join("Рабочий_отчет.txt");
    let mut file = OpenOptions::new()
        .write(true)
        .append(true)
        .create(true)
        .open(&file_path)
        .map_err(|e| format!("Ошибка открытия файла: {}", e))?;
    file.write_all(report.as_bytes())
        .map_err(|e| format!("Ошибка записи в файл: {}", e))?;

    state.start_time = None;
    state.total_duration = 0;
    state.is_running = false;
    state.pause_start = None;
    state.pause_duration = 0;
    state.deals_count = 0;

    Ok((total_work_seconds, total_pause_seconds, deals_count))
}

#[tauri::command]
fn get_timer_state() -> Result<TimerState, String> {
    let state = TIMER_STATE.lock().map_err(|e| e.to_string())?;
    Ok((**state).clone())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            start_timer,
            pause_timer,
            increment_deals,
            stop_timer,
            get_timer_state
        ])
        .run(tauri::generate_context!())
        .expect("Ошибка запуска приложения");
}