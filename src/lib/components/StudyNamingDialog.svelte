<script lang="ts">
    import { Dialog } from "bits-ui";

    let {
        open = $bindable(),
        title,
        studyName = $bindable(),
        onSubmit,
    } = $props<{
        open: boolean;
        title: string;
        studyName: string;
        onSubmit: () => void;
    }>();
</script>

<Dialog.Root bind:open>
    <Dialog.Portal>
        <Dialog.Overlay class="dialog-overlay" />
        <Dialog.Content class="dialog-content">
            <Dialog.Title class="dialog-title">{title}</Dialog.Title>
            <Dialog.Description class="dialog-description"
                >Please enter a name for this study.</Dialog.Description
            >
            <div class="dialog-field">
                <input
                    type="text"
                    class="input-field"
                    bind:value={studyName}
                    placeholder="Study name..."
                    onkeydown={(e) => e.key === "Enter" && onSubmit()}
                    autofocus
                />
            </div>
            <div class="dialog-actions">
                <Dialog.Close class="cancel-button">Cancel</Dialog.Close>
                <button
                    class="confirm-button"
                    onclick={onSubmit}
                    disabled={!studyName}>Confirm</button
                >
            </div>
        </Dialog.Content>
    </Dialog.Portal>
</Dialog.Root>

<style lang="scss">
    .dialog-field {
        margin-top: 8px;
    }
</style>
