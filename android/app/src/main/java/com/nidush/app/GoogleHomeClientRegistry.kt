package com.nidush.app

import android.app.Activity
import androidx.activity.result.ActivityResultCaller
import com.google.home.Home
import com.google.home.HomeClient
import com.google.home.HomeConfig

object GoogleHomeClientRegistry {
  @Volatile
  private var preparedClient: HomeClient? = null

  @Synchronized
  fun prepare(activity: Activity): HomeClient {
    preparedClient?.let { existing ->
      existing.registerActivityResultCallerForPermissions(activity.requireActivityResultCaller())
      return existing
    }

    val client = Home.getClient(
      activity,
      HomeConfig(serverClientId = BuildConfig.GOOGLE_HOME_SERVER_CLIENT_ID),
    )
    client.registerActivityResultCallerForPermissions(activity.requireActivityResultCaller())
    preparedClient = client
    return client
  }

  fun getPreparedClient(): HomeClient? = preparedClient

  private fun Activity.requireActivityResultCaller(): ActivityResultCaller {
    return this as? ActivityResultCaller
      ?: error("Google Home requires an ActivityResultCaller-compatible activity.")
  }
}
