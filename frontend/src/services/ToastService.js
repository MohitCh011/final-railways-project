class ToastService {
    callbacks = new Set();

    subscribe(callback) {
        this.callbacks.add(callback);
        return () => this.callbacks.delete(callback);
    }

    show(message, type = 'info', duration = 4000) {
        this.callbacks.forEach(cb => cb(message, type, duration));
    }

    success(msg) { this.show(msg, 'success'); }
    error(msg) { this.show(msg, 'error'); }
    warning(msg) { this.show(msg, 'warning'); }
    info(msg) { this.show(msg, 'info'); }
}

export const toast = new ToastService();
