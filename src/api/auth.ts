let authToken: string | undefined;

export function setAuthToken(token?: string) {
  authToken = token;
}

export function getAuthToken(): string | undefined {
  return authToken;
}
