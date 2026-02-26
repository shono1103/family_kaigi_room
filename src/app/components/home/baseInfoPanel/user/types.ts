export type UserViewProps = {
  userEmail: string;
  onEdit: () => void;
};

export type UserEditProps = {
  userEmail: string;
  onCancel: () => void;
};

export type UserPasswordEditProps = {
  onCancel: () => void;
};
