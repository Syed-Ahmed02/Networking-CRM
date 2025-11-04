import { BlurFade } from "../ui/blur-fade"
import { Button } from "../ui/button"
import { HeroVideoDialog } from "@/components/ui/hero-video-dialog"
import Link from "next/link"
export function Hero() {
    return (
        <div>
            <div className="flex flex-col items-center mx-8">
                <div className="my-16 text-center  w-full text-primary space-y-4">
                    <BlurFade delay={0.01}>
                        <h2 className="text-xl md:text-2xl  font-semibold w-full">
                            Build your network with ease
                        </h2>
                    </BlurFade>
                    <BlurFade delay={0.02} >
                        <h1 className="text-2xl md:text-6xl font-semibold max-w-5xl mx-auto">
                            Meet the right people, at the right time
                        </h1>
                    </BlurFade>
                    <BlurFade delay={0.03} inView={true}>
                        <p className="text-md md:text-xl w-full ">
                            No more confusion. No more wasted time. Just a clear, structured path to meeting the right people.
                        </p>
                    </BlurFade>
                    <BlurFade delay={0.04} >
                        <Link href="#form">
                            <Button variant="default" className="font-bold mt-8">Build Your Network Now</Button>
                        </Link>
                    </BlurFade>
                </div>

            </div>
            <div className="flex flex-col items-center max-w-6xl justify-center mx-4 lg:mx-auto">
                <BlurFade delay={0.05}>
                <div className="relative">
                    <HeroVideoDialog
                        className="dark:hidden block"
                        animationStyle="from-center"
                        videoSrc="https://www.youtube.com/embed/qh3NGpYRG3I?si=4rb-zSdDkVK9qxxb"
                        thumbnailSrc="https://startup-template-sage.vercel.app/hero-light.png"
                        thumbnailAlt="Hero Video"
                    />
                    <HeroVideoDialog
                        className="hidden dark:block"
                        animationStyle="from-center"
                        videoSrc="https://www.youtube.com/embed/qh3NGpYRG3I?si=4rb-zSdDkVK9qxxb"
                        thumbnailSrc="https://startup-template-sage.vercel.app/hero-dark.png"
                        thumbnailAlt="Hero Video"
                    />
                    </div>
                </BlurFade>
            </div>
        </div>
    )
}