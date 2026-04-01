export interface SelectedUser {
    userId: string;
    userName: string;
}
export interface UserPickerProps {
    client: any;
    value: SelectedUser[];
    onChange: (users: SelectedUser[]) => void;
    disabled?: boolean;
}
export declare function UserPicker({ client, value, onChange, disabled, }: UserPickerProps): import("react/jsx-runtime").JSX.Element;
