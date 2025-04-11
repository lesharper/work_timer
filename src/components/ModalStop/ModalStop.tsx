import { Show } from 'solid-js'


interface ModalProps {
    isOpen: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export function ModalStop(props: ModalProps) {
    return (
        <Show when={props.isOpen}>
            <div class="modal-overlay">
                <div class="modal">
                    <p>Вы уверены, что хотите обнулить таймер и сформировать отчет?</p>
                    <div class="modal-buttons">
                        <button onClick={props.onConfirm}>Да</button>
                        <button onClick={props.onCancel}>Нет</button>
                    </div>
                </div>
            </div>
        </Show>

    );
}