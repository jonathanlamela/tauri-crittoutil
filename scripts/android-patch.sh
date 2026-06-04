#!/bin/bash
# Run this after every `npx tauri android init` to restore customizations.
set -e

RES="src-tauri/gen/android/app/src/main/res"
ICONS="src-tauri/icons/android"

# 1. Correct launcher icons (all densities)
for density in mipmap-mdpi mipmap-hdpi mipmap-xhdpi mipmap-xxhdpi mipmap-xxxhdpi; do
  cp "$ICONS/$density/"* "$RES/$density/"
done

# 2. Adaptive icon XML — reference @drawable instead of @mipmap for the foreground
mkdir -p "$RES/mipmap-anydpi-v26"
cat > "$RES/mipmap-anydpi-v26/ic_launcher.xml" <<'EOF'
<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@drawable/ic_launcher_foreground"/>
</adaptive-icon>
EOF
cat > "$RES/mipmap-anydpi-v26/ic_launcher_round.xml" <<'EOF'
<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@drawable/ic_launcher_foreground"/>
</adaptive-icon>
EOF

# 3. Foreground drawable — shrink to safe zone with 18dp insets
cat > "$RES/drawable-v24/ic_launcher_foreground.xml" <<'EOF'
<?xml version="1.0" encoding="utf-8"?>
<layer-list xmlns:android="http://schemas.android.com/apk/res/android">
    <item
        android:top="18dp"
        android:bottom="18dp"
        android:left="18dp"
        android:right="18dp">
        <bitmap android:src="@mipmap/ic_launcher_foreground" />
    </item>
</layer-list>
EOF

# 4. Icon background color — matches app surface (light/dark)
cat > "$RES/values/ic_launcher_background.xml" <<'EOF'
<?xml version="1.0" encoding="utf-8"?>
<resources>
  <color name="ic_launcher_background">#F8F9FF</color>
</resources>
EOF
cat > "$RES/values-night/ic_launcher_background.xml" <<'EOF'
<?xml version="1.0" encoding="utf-8"?>
<resources>
  <color name="ic_launcher_background">#111318</color>
</resources>
EOF

# 5. App colors for splash
cat >> "$RES/values/colors.xml" <<'EOF'
    <color name="app_background_light">#F8F9FF</color>
    <color name="app_background_dark">#111318</color>
EOF

# 6. Splash / window background — light theme
cat > "$RES/values/themes.xml" <<'EOF'
<resources xmlns:tools="http://schemas.android.com/tools">
    <style name="Theme.crittoutil" parent="Theme.MaterialComponents.DayNight.NoActionBar">
        <item name="android:windowBackground">@color/app_background_light</item>
        <item name="android:statusBarColor">@color/app_background_light</item>
        <item name="android:navigationBarColor">@color/app_background_light</item>
    </style>
</resources>
EOF

# 7. Splash / window background — dark theme
cat > "$RES/values-night/themes.xml" <<'EOF'
<resources xmlns:tools="http://schemas.android.com/tools">
    <style name="Theme.crittoutil" parent="Theme.MaterialComponents.DayNight.NoActionBar">
        <item name="android:windowBackground">@color/app_background_dark</item>
        <item name="android:statusBarColor">@color/app_background_dark</item>
        <item name="android:navigationBarColor">@color/app_background_dark</item>
    </style>
</resources>
EOF

# 8. Gradle — force Java 17 (Homebrew) regardless of system JAVA_HOME
GRADLE_PROPS="src-tauri/gen/android/gradle.properties"
JAVA17="/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home"
if grep -q "org.gradle.java.home" "$GRADLE_PROPS"; then
  sed -i '' "s|org.gradle.java.home=.*|org.gradle.java.home=$JAVA17|" "$GRADLE_PROPS"
else
  echo "org.gradle.java.home=$JAVA17" >> "$GRADLE_PROPS"
fi

echo "Android patches applied."
