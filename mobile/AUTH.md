# Mobile authentication

The mobile app uses the Nest backend in `backend/`. Set `EXPO_PUBLIC_API_URL` in `mobile/.env` to the backend origin. This project configures the backend on port `8000`; Android emulator uses `http://10.0.2.2:8000`, iOS simulator and web use `http://localhost:8000`, and a physical phone needs the computer's LAN IP. Restart Expo after changing the URL. Use HTTPS in production.

Start the backend with `npm run start:dev` from `backend/`, then start the app with `npm start` from `mobile/`. The backend needs its configured MongoDB connection and `JWT_SECRET`.

Registration sends `name`, `username`, `email`, and `password` to `POST /auth/register`, then logs in through `POST /auth/login`. Login returns an access token, rotating refresh token, and user. On Android and iOS the session is stored with Expo SecureStore; web sessions remain in memory. Passwords are never stored. Startup calls `POST /auth/refresh` to validate and rotate a saved session before unlocking protected routes. The app also refreshes shortly before access token expiry. If refresh is rejected, the app returns to login. A temporary network failure locks protected routes while keeping the saved token for the next launch.

Logout calls `POST /auth/logout` and then clears local storage. If the backend is unreachable, the user can retry. Use `session.accessToken` as a Bearer token for authenticated API calls.

The current Nest backend provides email and password authentication only. Google and Apple buttons are hidden until corresponding backend endpoints are implemented. Existing sessions from the previous backend use a different SecureStore key and require a new sign-in.

## Profile onboarding

After registration or sign-in, accounts without a saved nutrition profile enter six onboarding steps: personal details, measurements, goal, activity, optional dietary preferences, and a reviewable nutrition plan. The backend estimates daily calories and macros with the Mifflin–St Jeor resting energy equation plus an activity and goal adjustment. Goals include losing weight, maintaining weight, gaining weight, building muscle, and losing fat while building muscle. Only weight-loss and weight-gain goals constrain the optional target weight; muscle goals do not assume weight gain. Protein targets vary by goal (1.4–2.0 g/kg). This adult-only estimate is a starting point. Users can edit targets before saving and revisit the profile from the Profile tab. `GET /profile`, `POST /profile/estimate`, and `PUT /profile` require the access token.

The saved plan also includes food guidance based on goal, activity, vegetarian/vegan/halal choices, and free-text restrictions. When allergies, avoided foods, or other free-text preferences are present, the app withholds specific meal ideas because it cannot verify ingredients or cross-contact. The user must check labels and ingredients for their own safety.

For muscle and combined fat-loss/muscle goals, the optional target weight sets the calorie direction: below current weight uses a 300 kcal deficit and 2.0 g/kg protein; equal weight uses maintenance calories; above current weight uses a modest surplus. This is an initial estimate, not a timeline to the target weight.

Profile photos: the Profile tab lets users crop and upload a JPEG, PNG, or WebP photo. The authenticated backend stores it in a private Cloudflare R2 bucket and returns a temporary signed display URL. Configure backend R2 credentials as described in `../backend/R2.md`; no R2 secret belongs in the mobile app.

The image-picker permission message is configured in `app.json`. A new development build is required for that native configuration change; Expo Go can still be used to try the JavaScript flow.

Height and weight use a drag-to-adjust ruler built from React Native views, with plus/minus controls and exact-value inputs. It does not require an additional native module.
