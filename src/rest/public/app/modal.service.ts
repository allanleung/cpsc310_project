/**
 * Created by Jnani on 3/17/17.
 */
import {Injectable, ViewContainerRef, ReflectiveInjector, ComponentFactoryResolver, ComponentRef} from '@angular/core';
import { Http, Headers } from '@angular/http';

import 'rxjs/add/operator/toPromise';
import {ModalComponent} from "./modal.component";

@Injectable()
export class ModalService {
    private viewContainerRef: ViewContainerRef;
    private instances: number;

    constructor(private resolver: ComponentFactoryResolver) { }

    registerViewContainer(viewContainerRef: ViewContainerRef) {
        this.viewContainerRef = viewContainerRef;
    }

    create<T>(component: any, parameters: any): ComponentRef<T> {
        // Inject
        let factory = this.resolver.resolveComponentFactory(component);

        // Allow DI
        const injector = ReflectiveInjector.fromResolvedProviders([], this.viewContainerRef.parentInjector);
        let componentRef = this.viewContainerRef.createComponent(factory, 0, injector, []);

        // Assign parameters to the new component
        Object.assign(componentRef.instance, parameters);
        this.instances++;

        // Destroy the component when destroy() is invoked
        componentRef.instance["destroy"] = () => {
            this.instances--;
            componentRef.destroy();
        };

        return componentRef as ComponentRef<T>;
    };
}
