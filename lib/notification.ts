export interface NotificationSettings {
  enabled: boolean
  soundEnabled: boolean
  minProfitThreshold: number
  volume: number
}

export class NotificationManager {
  private audioContext: AudioContext | null = null
  private settings: NotificationSettings

  constructor() {
    this.settings = this.loadSettings()
    this.initAudioContext()
  }

  private loadSettings(): NotificationSettings {
    if (typeof window === "undefined") {
      return {
        enabled: true,
        soundEnabled: true,
        minProfitThreshold: 1.0,
        volume: 0.5,
      }
    }

    const saved = localStorage.getItem("notification-settings")
    if (saved) {
      return JSON.parse(saved)
    }

    return {
      enabled: true,
      soundEnabled: true,
      minProfitThreshold: 1.0,
      volume: 0.5,
    }
  }

  public saveSettings(settings: NotificationSettings) {
    this.settings = settings
    if (typeof window !== "undefined") {
      localStorage.setItem("notification-settings", JSON.stringify(settings))
    }
  }

  public getSettings(): NotificationSettings {
    return { ...this.settings }
  }

  private async initAudioContext() {
    if (typeof window === "undefined") return

    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    } catch (error) {
      console.warn("无法初始化音频上下文:", error)
    }
  }

  private async playBeep(frequency = 800, duration = 200) {
    if (!this.audioContext || !this.settings.soundEnabled) return

    try {
      // 确保音频上下文处于运行状态
      if (this.audioContext.state === "suspended") {
        await this.audioContext.resume()
      }

      const oscillator = this.audioContext.createOscillator()
      const gainNode = this.audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(this.audioContext.destination)

      oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime)
      oscillator.type = "sine"

      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime)
      gainNode.gain.linearRampToValueAtTime(this.settings.volume, this.audioContext.currentTime + 0.01)
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration / 1000)

      oscillator.start(this.audioContext.currentTime)
      oscillator.stop(this.audioContext.currentTime + duration / 1000)
    } catch (error) {
      console.warn("播放提示音失败:", error)
    }
  }

  public async playArbitrageAlert() {
    if (!this.settings.soundEnabled) return

    // 连续播放3次提示音
    for (let i = 0; i < 3; i++) {
      await this.playBeep(800, 300)
      if (i < 2) {
        await new Promise((resolve) => setTimeout(resolve, 200))
      }
    }
  }

  public async showNotification(title: string, message: string, profitPercentage: number) {
    if (!this.settings.enabled || profitPercentage < this.settings.minProfitThreshold) {
      return
    }

    // 播放声音提醒
    await this.playArbitrageAlert()

    // 显示浏览器通知
    if (typeof window !== "undefined" && "Notification" in window) {
      try {
        if (Notification.permission === "granted") {
          new Notification(title, {
            body: message,
            icon: "/favicon.ico",
            badge: "/favicon.ico",
            tag: "arbitrage-opportunity",
            requireInteraction: true,
          })
        } else if (Notification.permission !== "denied") {
          const permission = await Notification.requestPermission()
          if (permission === "granted") {
            new Notification(title, {
              body: message,
              icon: "/favicon.ico",
              badge: "/favicon.ico",
              tag: "arbitrage-opportunity",
              requireInteraction: true,
            })
          }
        }
      } catch (error) {
        console.warn("显示通知失败:", error)
      }
    }
  }

  public async requestPermission(): Promise<boolean> {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return false
    }

    try {
      const permission = await Notification.requestPermission()
      return permission === "granted"
    } catch (error) {
      console.warn("请求通知权限失败:", error)
      return false
    }
  }
}

// 全局通知管理器实例
export const notificationManager = new NotificationManager()
