package com.nidush.app

import android.app.Activity
import android.util.Log
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.google.home.ConsentScreenOptions
import com.google.home.ForcePermissionFlow
import com.google.home.HomeClient
import com.google.home.HomeDevice
import com.google.home.HomeError
import com.google.home.HomeException
import com.google.home.Room
import com.google.home.PermissionsResultStatus
import com.google.home.PermissionsState
import com.google.home.matter.standard.ColorTemperatureLightDevice
import com.google.home.matter.standard.DimmableLightDevice
import com.google.home.matter.standard.ExtendedColorLightDevice
import com.google.home.matter.standard.ColorControlTrait
import com.google.home.matter.standard.LevelControlTrait
import com.google.home.matter.standard.OnOffLightDevice
import com.google.home.matter.standard.OnOffPluginUnitDevice
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.runBlocking
import kotlin.math.roundToInt

class GoogleHomeModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {
  companion object {
    private const val TAG = "GoogleHomeModule"
  }

  override fun getName(): String = "GoogleHomeModule"

  @ReactMethod
  fun isConfigured(promise: Promise) {
    promise.resolve(BuildConfig.GOOGLE_HOME_SERVER_CLIENT_ID.isNotBlank())
  }

  @ReactMethod
  fun requestAccess(promise: Promise) {
    val activity = reactApplicationContext.currentActivity
    if (activity == null) {
      promise.reject("GOOGLE_HOME_NO_ACTIVITY", "Google Home requires an active Android screen.")
      return
    }

    if (BuildConfig.GOOGLE_HOME_SERVER_CLIENT_ID.isBlank()) {
      val payload = Arguments.createMap().apply {
        putBoolean("granted", false)
        putBoolean("requiresNativeBuild", false)
        putString("reason", "Missing Google Home Web OAuth client id in this Android build.")
      }
      promise.resolve(payload)
      return
    }

    try {
      val client = getOrCreateHomeClient(activity)

      val permissionsState = runBlocking {
        client.hasPermissions().first()
      }

      if (permissionsState == PermissionsState.GRANTED) {
        val payload = Arguments.createMap().apply {
          putBoolean("granted", true)
          putBoolean("requiresNativeBuild", false)
          putString("reason", null)
        }
        promise.resolve(payload)
        return
      }

      val result = runBlocking {
        client.requestPermissions(
          ForcePermissionFlow.FORCE_LAUNCH,
          ConsentScreenOptions(),
        )
      }

      Log.d(
        TAG,
        "requestPermissions status=${result.status} error=${result.errorMessage} hasServerAuthCode=${!result.serverAuthCode.isNullOrBlank()}",
      )

      val payload = Arguments.createMap().apply {
        putBoolean("granted", result.status == PermissionsResultStatus.SUCCESS)
        putBoolean("requiresNativeBuild", false)
        putString(
          "reason",
          when (result.status) {
            PermissionsResultStatus.SUCCESS -> null
            PermissionsResultStatus.CANCELLED -> buildString {
              append("Google Home permission request was cancelled.")
              if (!result.errorMessage.isNullOrBlank()) {
                append(" SDK details: ")
                append(result.errorMessage)
              }
            }
            PermissionsResultStatus.ERROR -> buildString {
              append("Google Home permission request failed.")
              if (!result.errorMessage.isNullOrBlank()) {
                append(" SDK details: ")
                append(result.errorMessage)
              }
            }
          },
        )
      }
      promise.resolve(payload)
    } catch (error: Throwable) {
      Log.e(TAG, "requestAccess failed", error)
      promise.reject("GOOGLE_HOME_REQUEST_ACCESS_FAILED", error.message, error)
    }
  }

  @ReactMethod
  fun syncDevices(promise: Promise) {
    val activity = reactApplicationContext.currentActivity
    if (activity == null) {
      promise.reject("GOOGLE_HOME_NO_ACTIVITY", "Google Home requires an active Android screen.")
      return
    }

    try {
      val client = getOrCreateHomeClient(activity)

      val permissionsState = runBlocking {
        client.hasPermissions().first()
      }

      if (permissionsState != PermissionsState.GRANTED) {
        promise.reject("GOOGLE_HOME_PERMISSIONS", "Google Home permissions have not been granted yet.")
        return
      }

      val devices = runBlocking {
        try {
          client.syncLinkedDevices()
        } catch (error: Throwable) {
          Log.w(TAG, "syncLinkedDevices failed, trying cached device list instead", error)
        }

        client.devices(true).list()
      }

      val structures = runBlocking { client.structures().list() }
      val rooms = runBlocking { client.rooms().list() }
      val deviceRooms = runBlocking {
        devices.associate { device ->
          device.id.toString() to resolveRoomForDevice(device)
        }
      }
      val effectiveRooms = mergeRooms(rooms, deviceRooms.values)

      Log.d(
        TAG,
        "syncDevices returned ${devices.size} devices, ${structures.size} structures, ${effectiveRooms.size} rooms",
      )

      val payload = Arguments.createMap()
      val array = Arguments.createArray()
      devices.forEach { device ->
        array.pushMap(deviceToWritableMap(device, deviceRooms[device.id.toString()]))
      }
      payload.putArray("devices", array)
      payload.putMap(
        "diagnostics",
        Arguments.createMap().apply {
          putInt("structureCount", structures.size)
          putInt("roomCount", effectiveRooms.size)
          putArray(
            "structures",
            Arguments.createArray().apply {
              structures.forEach { structure ->
                pushMap(
                  Arguments.createMap().apply {
                    putString("id", structure.id.toString())
                    putString("name", structure.name)
                  },
                )
              }
            },
          )
          putArray(
            "rooms",
            Arguments.createArray().apply {
              effectiveRooms.forEach { room ->
                pushMap(
                  Arguments.createMap().apply {
                    putString("id", room.id.toString())
                    putString("name", room.name)
                    putString("structureId", room.structureId.toString())
                  },
                )
              }
            },
          )
        },
      )
      promise.resolve(payload)
    } catch (error: Throwable) {
      Log.e(TAG, "syncDevices failed", error)
      val message = formatThrowable(error)
      promise.reject("GOOGLE_HOME_SYNC_FAILED", message, error)
    }
  }

  @ReactMethod
  fun setDevicePower(externalId: String, powerOn: Boolean, promise: Promise) {
    val activity = reactApplicationContext.currentActivity
    if (activity == null) {
      promise.reject("GOOGLE_HOME_NO_ACTIVITY", "Google Home requires an active Android screen.")
      return
    }

    try {
      val client = getOrCreateHomeClient(activity)

      val permissionsState = runBlocking {
        client.hasPermissions().first()
      }

      if (permissionsState != PermissionsState.GRANTED) {
        promise.reject("GOOGLE_HOME_PERMISSIONS", "Google Home permissions have not been granted yet.")
        return
      }

      val targetId = externalId.trim()
      if (targetId.isBlank()) {
        promise.reject("GOOGLE_HOME_INVALID_DEVICE", "Missing Google Home device id.")
        return
      }

      val devices = runBlocking { client.devices(true).list() }
      val device = devices.firstOrNull { it.id.toString() == targetId }
        ?: throw IllegalArgumentException("Google Home device not found for id $targetId")

      runBlocking {
        executeOnOffCommand(device, powerOn)
      }

      promise.resolve(
        Arguments.createMap().apply {
          putBoolean("success", true)
        },
      )
    } catch (error: Throwable) {
      Log.e(TAG, "setDevicePower failed for $externalId", error)
      promise.reject("GOOGLE_HOME_CONTROL_FAILED", formatThrowable(error), error)
    }
  }

  @ReactMethod
  fun setDeviceBrightness(externalId: String, level: Int, promise: Promise) {
    val activity = reactApplicationContext.currentActivity
    if (activity == null) {
      promise.reject("GOOGLE_HOME_NO_ACTIVITY", "Google Home requires an active Android screen.")
      return
    }

    try {
      val client = getOrCreateHomeClient(activity)

      val permissionsState = runBlocking {
        client.hasPermissions().first()
      }

      if (permissionsState != PermissionsState.GRANTED) {
        promise.reject("GOOGLE_HOME_PERMISSIONS", "Google Home permissions have not been granted yet.")
        return
      }

      val targetId = externalId.trim()
      if (targetId.isBlank()) {
        promise.reject("GOOGLE_HOME_INVALID_DEVICE", "Missing Google Home device id.")
        return
      }

      val devices = runBlocking { client.devices(true).list() }
      val device = devices.firstOrNull { it.id.toString() == targetId }
        ?: throw IllegalArgumentException("Google Home device not found for id $targetId")

      runBlocking {
        executeLevelCommand(device, level)
      }

      promise.resolve(
        Arguments.createMap().apply {
          putBoolean("success", true)
        },
      )
    } catch (error: Throwable) {
      Log.e(TAG, "setDeviceBrightness failed for $externalId", error)
      promise.reject("GOOGLE_HOME_CONTROL_FAILED", formatThrowable(error), error)
    }
  }

  @ReactMethod
  fun setDeviceColor(externalId: String, colorHex: String, promise: Promise) {
    val activity = reactApplicationContext.currentActivity
    if (activity == null) {
      promise.reject("GOOGLE_HOME_NO_ACTIVITY", "Google Home requires an active Android screen.")
      return
    }

    try {
      val client = getOrCreateHomeClient(activity)

      val permissionsState = runBlocking {
        client.hasPermissions().first()
      }

      if (permissionsState != PermissionsState.GRANTED) {
        promise.reject("GOOGLE_HOME_PERMISSIONS", "Google Home permissions have not been granted yet.")
        return
      }

      val targetId = externalId.trim()
      if (targetId.isBlank()) {
        promise.reject("GOOGLE_HOME_INVALID_DEVICE", "Missing Google Home device id.")
        return
      }

      val normalizedColor = colorHex.trim()
      if (normalizedColor.isBlank()) {
        promise.reject("GOOGLE_HOME_INVALID_COLOR", "Missing Google Home color value.")
        return
      }

      val devices = runBlocking { client.devices(true).list() }
      val device = devices.firstOrNull { it.id.toString() == targetId }
        ?: throw IllegalArgumentException("Google Home device not found for id $targetId")

      runBlocking {
        executeColorCommand(device, normalizedColor)
      }

      promise.resolve(
        Arguments.createMap().apply {
          putBoolean("success", true)
        },
      )
    } catch (error: Throwable) {
      Log.e(TAG, "setDeviceColor failed for $externalId", error)
      promise.reject("GOOGLE_HOME_CONTROL_FAILED", formatThrowable(error), error)
    }
  }

  private fun getOrCreateHomeClient(activity: Activity): HomeClient {
    return GoogleHomeClientRegistry.getPreparedClient()
      ?: (activity as? MainActivity)?.let { GoogleHomeClientRegistry.prepare(it) }
      ?: throw IllegalStateException(
        "Google Home permissions launcher is not prepared. Rebuild the Android app and reopen it.",
      )
  }

  private fun deviceToWritableMap(device: HomeDevice, room: Room?) = Arguments.createMap().apply {
    putString("externalId", device.id.toString())
    putString("name", device.name)
    putString("type", inferDeviceType(device))
    putString("roomName", room?.name)
    putString("roomHint", room?.name)
    putString("manufacturer", null)
    putString("model", null)
    putBoolean("isOnline", device.sourceConnectivity.toString().contains("ONLINE", ignoreCase = true))
    putBoolean("isOn", false)
    val traits = Arguments.createArray()
    putArray("traits", traits)
  }

  private fun inferDeviceType(device: HomeDevice): String {
    return when {
      device.has(ExtendedColorLightDevice.Companion) ||
        device.has(ColorTemperatureLightDevice.Companion) ||
        device.has(DimmableLightDevice.Companion) ||
        device.has(OnOffLightDevice.Companion) -> "light"
      device.has(OnOffPluginUnitDevice.Companion) -> "outlet"
      else -> "unknown"
    }
  }

  private suspend fun executeOnOffCommand(device: HomeDevice, powerOn: Boolean) {
    when {
      device.has(ExtendedColorLightDevice.Companion) -> {
        val light = device.typeOrNull(ExtendedColorLightDevice.Companion).first()
          ?: throw IllegalArgumentException("Google Home extended-color light type is unavailable.")
        val onOff = light.standardTraits.onOff
          ?: throw IllegalArgumentException("Google Home extended-color light does not expose OnOff control.")
        if (powerOn) onOff.on() else onOff.off()
      }
      device.has(ColorTemperatureLightDevice.Companion) -> {
        val light = device.typeOrNull(ColorTemperatureLightDevice.Companion).first()
          ?: throw IllegalArgumentException("Google Home color-temperature light type is unavailable.")
        val onOff = light.standardTraits.onOff
          ?: throw IllegalArgumentException("Google Home color-temperature light does not expose OnOff control.")
        if (powerOn) onOff.on() else onOff.off()
      }
      device.has(DimmableLightDevice.Companion) -> {
        val light = device.typeOrNull(DimmableLightDevice.Companion).first()
          ?: throw IllegalArgumentException("Google Home dimmable light type is unavailable.")
        val onOff = light.standardTraits.onOff
          ?: throw IllegalArgumentException("Google Home dimmable light does not expose OnOff control.")
        if (powerOn) onOff.on() else onOff.off()
      }
      device.has(OnOffLightDevice.Companion) -> {
        val light = device.typeOrNull(OnOffLightDevice.Companion).first()
          ?: throw IllegalArgumentException("Google Home light type is unavailable.")
        val onOff = light.standardTraits.onOff
          ?: throw IllegalArgumentException("Google Home light does not expose OnOff control.")
        if (powerOn) onOff.on() else onOff.off()
      }
      device.has(OnOffPluginUnitDevice.Companion) -> {
        val outlet = device.typeOrNull(OnOffPluginUnitDevice.Companion).first()
          ?: throw IllegalArgumentException("Google Home outlet type is unavailable.")
        val onOff = outlet.standardTraits.onOff
          ?: throw IllegalArgumentException("Google Home outlet does not expose OnOff control.")
        if (powerOn) onOff.on() else onOff.off()
      }
      else -> throw IllegalArgumentException("This Google Home device type does not support on/off control yet.")
    }
  }

  private suspend fun executeLevelCommand(device: HomeDevice, levelPercent: Int) {
    val matterLevel = levelPercentToMatterLevel(levelPercent)
    val duration = 0.toUShort()
    val options = LevelControlTrait.OptionsBitmap(
      true,
      false,
    )
    val optionsMask = LevelControlTrait.OptionsBitmap(
      true,
      false,
    )

    when {
      device.has(ExtendedColorLightDevice.Companion) -> {
        val light = device.typeOrNull(ExtendedColorLightDevice.Companion).first()
          ?: throw IllegalArgumentException("Google Home extended-color light type is unavailable.")
        val levelControl = light.standardTraits.levelControl
          ?: throw IllegalArgumentException("This Google Home device does not support brightness control yet.")
        levelControl.moveToLevelWithOnOff(matterLevel, duration, options, optionsMask)
      }
      device.has(ColorTemperatureLightDevice.Companion) -> {
        val light = device.typeOrNull(ColorTemperatureLightDevice.Companion).first()
          ?: throw IllegalArgumentException("Google Home color-temperature light type is unavailable.")
        val levelControl = light.standardTraits.levelControl
          ?: throw IllegalArgumentException("This Google Home device does not support brightness control yet.")
        levelControl.moveToLevelWithOnOff(matterLevel, duration, options, optionsMask)
      }
      device.has(DimmableLightDevice.Companion) -> {
        val light = device.typeOrNull(DimmableLightDevice.Companion).first()
          ?: throw IllegalArgumentException("Google Home dimmable light type is unavailable.")
        val levelControl = light.standardTraits.levelControl
          ?: throw IllegalArgumentException("This Google Home device does not support brightness control yet.")
        levelControl.moveToLevelWithOnOff(matterLevel, duration, options, optionsMask)
      }
      device.has(OnOffLightDevice.Companion) -> {
        val light = device.typeOrNull(OnOffLightDevice.Companion).first()
          ?: throw IllegalArgumentException("Google Home light type is unavailable.")
        val levelControl = light.standardTraits.levelControl
          ?: throw IllegalArgumentException("This Google Home device does not support brightness control yet.")
        levelControl.moveToLevelWithOnOff(matterLevel, duration, options, optionsMask)
      }
      device.has(OnOffPluginUnitDevice.Companion) -> {
        val outlet = device.typeOrNull(OnOffPluginUnitDevice.Companion).first()
          ?: throw IllegalArgumentException("Google Home outlet type is unavailable.")
        val levelControl = outlet.standardTraits.levelControl
          ?: throw IllegalArgumentException("This Google Home device does not support brightness control yet.")
        levelControl.moveToLevelWithOnOff(matterLevel, duration, options, optionsMask)
      }
      else -> throw IllegalArgumentException("This Google Home device type does not support brightness control yet.")
    }
  }

  private suspend fun executeColorCommand(device: HomeDevice, colorHex: String) {
    val (red, green, blue) = parseHexColor(colorHex)

    when {
      device.has(ExtendedColorLightDevice.Companion) -> {
        val light = device.typeOrNull(ExtendedColorLightDevice.Companion).first()
          ?: throw IllegalArgumentException("Google Home extended-color light type is unavailable.")
        val colorControl = light.googleTraits.extendedColorControl
          ?: throw IllegalArgumentException("This Google Home device does not support color control yet.")
        colorControl.moveToColorRgb(red.toUByte(), green.toUByte(), blue.toUByte())
      }
      device.has(ColorTemperatureLightDevice.Companion) -> {
        val light = device.typeOrNull(ColorTemperatureLightDevice.Companion).first()
          ?: throw IllegalArgumentException("Google Home color-temperature light type is unavailable.")
        val colorControl = light.standardTraits.colorControl
          ?: throw IllegalArgumentException("This Google Home device does not support color control yet.")
        val (hue, saturation) = rgbToMatterHueAndSaturation(red, green, blue)
        val options = ColorControlTrait.OptionsBitmap(true)
        val optionsMask = ColorControlTrait.OptionsBitmap(true)
        colorControl.moveToHueAndSaturation(hue, saturation, 0.toUShort(), options, optionsMask)
      }
      else -> throw IllegalArgumentException("This Google Home device type does not support color control yet.")
    }
  }

  private fun levelPercentToMatterLevel(levelPercent: Int): UByte {
    val clamped = levelPercent.coerceIn(0, 100)
    val scaled = ((clamped / 100.0) * 254.0).roundToInt().coerceIn(0, 254)
    return scaled.toUByte()
  }

  private fun parseHexColor(colorHex: String): Triple<Int, Int, Int> {
    val normalized = colorHex.removePrefix("#").trim()
    val expanded = when (normalized.length) {
      3 -> normalized.flatMap { listOf(it, it) }.joinToString("")
      6 -> normalized
      else -> throw IllegalArgumentException("Invalid Google Home color. Use a hex color like #EBCF68.")
    }

    val red = expanded.substring(0, 2).toInt(16)
    val green = expanded.substring(2, 4).toInt(16)
    val blue = expanded.substring(4, 6).toInt(16)
    return Triple(red, green, blue)
  }

  private fun rgbToMatterHueAndSaturation(red: Int, green: Int, blue: Int): Pair<UByte, UByte> {
    val r = red / 255.0
    val g = green / 255.0
    val b = blue / 255.0

    val max = maxOf(r, g, b)
    val min = minOf(r, g, b)
    val delta = max - min

    val hueDegrees = when {
      delta == 0.0 -> 0.0
      max == r -> 60.0 * (((g - b) / delta).mod(6.0))
      max == g -> 60.0 * (((b - r) / delta) + 2.0)
      else -> 60.0 * (((r - g) / delta) + 4.0)
    }

    val saturation = if (max == 0.0) 0.0 else delta / max

    val hueByte = ((hueDegrees / 360.0) * 254.0).roundToInt().coerceIn(0, 254).toUByte()
    val saturationByte = (saturation * 254.0).roundToInt().coerceIn(0, 254).toUByte()
    return hueByte to saturationByte
  }

  private suspend fun resolveRoomForDevice(device: HomeDevice): Room? {
    return try {
      device.room()
    } catch (error: Throwable) {
      Log.w(TAG, "Could not resolve room for device ${device.id}", error)
      null
    }
  }

  private fun mergeRooms(rooms: Collection<Room>, fallbackRooms: Collection<Room?>): List<Room> {
    val merged = LinkedHashMap<String, Room>()

    rooms.forEach { room ->
      merged[room.id.toString()] = room
    }

    fallbackRooms.filterNotNull().forEach { room ->
      merged.putIfAbsent(room.id.toString(), room)
    }

    return merged.values.toList()
  }

  private fun formatThrowable(error: Throwable): String {
    val primary = buildString {
      when (error) {
        is HomeException -> append(formatHomeException(error))
        else -> append(error.message ?: "Google Home sync failed.")
      }

      error.cause?.message?.takeIf { it.isNotBlank() }?.let {
        if (!contains(it)) {
          append(" Cause: ")
          append(it)
        }
      }
    }

    return primary.ifBlank { "Google Home sync failed." }
  }

  private fun formatHomeException(error: HomeException): String {
    val sdkMessage = error.message?.takeIf { it.isNotBlank() } ?: "Google Home sync failed."
    val primaryError = formatHomeError(error.error)
    val subErrors = error.subErrors
      .entries
      .joinToString("; ") { (key, value) ->
        val scopedKey = key.takeIf { it.isNotBlank() } ?: "unknown"
        "$scopedKey => ${formatHomeError(value)}"
      }

    return buildString {
      append("Google Home sync failed.")
      append(" Code: ")
      append(error.error.code)

      if (!sdkMessage.equals(primaryError, ignoreCase = true)) {
        append(" Message: ")
        append(sdkMessage)
      }

      if (primaryError.isNotBlank()) {
        append(" Primary error: ")
        append(primaryError)
      }

      if (subErrors.isNotBlank()) {
        append(" Sub-errors: ")
        append(subErrors)
      }
    }
  }

  private fun formatHomeError(error: HomeError?): String {
    if (error == null) return ""

    return buildString {
      append("code=")
      append(error.code)

      error.domain?.let {
        append(", domain=")
        append(it.domainName)
      }

      error.reason?.takeIf { it.isNotBlank() }?.let {
        append(", reason=")
        append(it)
      }

      error.message.takeIf { it.isNotBlank() }?.let {
        append(", message=")
        append(it)
      }
    }
  }
}
